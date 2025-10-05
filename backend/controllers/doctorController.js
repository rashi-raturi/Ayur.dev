import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import foodModel from "../models/foodModel.js";
import dietChartModel from "../models/dietChartModel.js";
import { queryRelevantFoods } from "../services/fastVectorService.js"; // ⚡ LIGHTNING FAST VECTOR SEARCH
import { GoogleGenerativeAI } from "@google/generative-ai";
import transporter from "../config/nodemailer.js";
import { generatePrescriptionPDF } from "../utils/pdfGenerator.js";
import { getPrescriptionEmailTemplate } from "../utils/emailTemplate.js";

// In-memory cache for food database
let foodCache = {
  data: null,
  timestamp: null,
  version: "1.0.0", // Increment this when food DB is updated
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (monthly cache)
};

// In-memory cache for doctor dashboards
// Key structure: { doctorId: { data, timestamp } }
let dashboardCache = {
  ttl: 5 * 60 * 1000, // 5 minutes in milliseconds (dashboard updates frequently)
  data: new Map(), // Use Map for better performance with many doctors
};

// Helper function to get cached dashboard data
const getCachedDashboard = (doctorId) => {
  const cached = dashboardCache.data.get(doctorId);
  if (!cached) return null;
  
  const now = Date.now();
  const age = now - cached.timestamp;
  
  if (age > dashboardCache.ttl) {
    // Cache expired
    dashboardCache.data.delete(doctorId);
    return null;
  }
  
  return cached.data;
};

// Helper function to set dashboard cache
const setCachedDashboard = (doctorId, data) => {
  dashboardCache.data.set(doctorId, {
    data,
    timestamp: Date.now()
  });
};

// Helper function to clear dashboard cache for a doctor
const clearDoctorDashboardCache = (doctorId) => {
  if (doctorId) {
    dashboardCache.data.delete(doctorId);
  }
};

// In-memory cache for patient AI summaries
// Key structure: { patientId: { content, timestamp, version } }
let aiSummaryCache = {
  ttl: 60 * 60 * 1000, // 1 hour in milliseconds
  data: new Map(),
};

// Helper function to get cached AI summary
const getCachedAISummary = (patientId, currentVersion) => {
  const cached = aiSummaryCache.data.get(patientId);
  if (!cached) return null;
  
  const now = Date.now();
  const age = now - cached.timestamp;
  
  // Check if cache expired or version changed
  if (age > aiSummaryCache.ttl || cached.version !== currentVersion) {
    aiSummaryCache.data.delete(patientId);
    return null;
  }
  
  return cached.content;
};

// Helper function to set AI summary cache
const setCachedAISummary = (patientId, content, version) => {
  aiSummaryCache.data.set(patientId, {
    content,
    timestamp: Date.now(),
    version
  });
};

// Helper function to clear AI summary cache
const clearAISummaryCache = (patientId) => {
  if (patientId) {
    aiSummaryCache.data.delete(patientId);
  }
};

// Function to generate AI summary for a patient
const generatePatientAISummary = async (patientId) => {
  try {
    // Fetch patient data
    const patient = await userModel.findById(patientId);
    
    if (!patient) {
      throw new Error('Patient not found');
    }
    
    // Fetch prescriptions separately from Prescription collection
    const prescriptions = await prescriptionModel
      .find({ patientId: patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    // Calculate age
    let age = 'N/A';
    if (patient.dob) {
      const birthDate = new Date(patient.dob);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Calculate BMI if height and weight available
    let bmi = 'N/A';
    if (patient.height && patient.weight && patient.height.feet > 0) {
      const heightInMeters = ((patient.height.feet * 12) + (patient.height.inches || 0)) * 0.0254;
      bmi = (patient.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    
    // Build prescription summary
    const prescriptionSummaries = prescriptions.slice(0, 5).map((rx, index) => {
      if (!rx) return null;
      
      const date = rx.createdAt ? new Date(rx.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }) : 'Unknown date';
      
      const medications = rx.medications && rx.medications.length > 0
        ? rx.medications.map(med => `${med.name} (${med.dosage}${med.duration ? ', ' + med.duration : ''})`).join(', ')
        : 'No medications';
      
      return `${index + 1}. Date: ${date}
   - Chief Complaint: ${rx.chiefComplaint || 'Not specified'}
   - Diagnosis: ${rx.diagnosis || 'Not specified'}
   - Medications: ${medications}
   - Dietary Recommendations: ${rx.dietaryRecommendations ? (rx.dietaryRecommendations.length > 100 ? rx.dietaryRecommendations.substring(0, 100) + '...' : rx.dietaryRecommendations) : 'None'}
   - Lifestyle Advice: ${rx.lifestyleAdvice ? (rx.lifestyleAdvice.length > 100 ? rx.lifestyleAdvice.substring(0, 100) + '...' : rx.lifestyleAdvice) : 'None'}`;
    }).filter(Boolean).join('\n\n');
    
    // Build AI prompt
    const prompt = `You are an Ayurvedic healthcare AI assistant. Generate a comprehensive, professional patient summary based on the following information.

PATIENT INFORMATION:
- Name: ${patient.name}
- Age: ${age} years
- Gender: ${patient.gender}
- Constitution (Prakriti): ${patient.constitution || 'Not assessed'}
- BMI: ${bmi}
- Bowel Movements: ${patient.bowel_movements || 'Not recorded'}

MEDICAL PROFILE:
- Primary Condition: ${patient.condition || 'General wellness'}
- Food Allergies: ${patient.foodAllergies || 'None reported'}
- Current Medications: ${patient.medications && patient.medications.length > 0 ? patient.medications.join(', ') : 'None'}
- Doctor's Notes: ${patient.notes || 'No additional notes'}

PRESCRIPTION HISTORY (${prescriptions.length} total prescriptions):
${prescriptionSummaries || 'No prescriptions recorded yet'}

INSTRUCTIONS:
Generate a comprehensive patient summary in **Markdown format** with the following structure. Do NOT use emojis - the UI will add icons automatically.

## Patient Overview
[Brief 2-3 sentence overview of patient's health status and constitution]

## Health Profile
- **Constitution (Prakriti):** [Analysis based on constitution]
- **Current Health Status:** [Assessment based on condition and symptoms]
- **BMI Status:** [Interpretation of BMI with recommendations if needed]
- **Digestive Health:** [Analysis based on bowel movements]

## Key Health Trends
[Bullet points identifying patterns from prescription history. If no clear patterns exist, state "Insufficient data for trend analysis" or "No significant trends identified yet"]
- Pattern 1 (only if there are real patterns)
- Pattern 2 (only if there are real patterns)
- Pattern 3 (only if there are real patterns)

## Risk Factors & Concerns
[List any health concerns or risk factors based on the data. Use **bold** for emphasis on key terms (e.g., **Underweight**, **Hair Loss**, **Kapha Imbalance**). Do NOT use asterisks like ****. If no risk factors, state "No significant risk factors identified"]
- **Risk Factor Name:** Description of the risk factor and its implications
- **Risk Factor Name:** Description of the risk factor and its implications

## Treatment Progress
[Analysis of treatment history and progress over time]
- What has been treated
- Medications patterns
- Treatment outcomes (if inferable)

## Dietary Considerations
[Key dietary recommendations based on constitution, allergies, and prescriptions]
- Recommendation 1
- Recommendation 2
- Recommendation 3

## Recommendations for Continued Care
[Forward-looking recommendations for the doctor]
1. Recommendation 1
2. Recommendation 2
3. Recommendation 3

## Quick Reference
- **Last Consultation:** ${prescriptions.length > 0 && prescriptions[0].createdAt ? new Date(prescriptions[0].createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'No consultations yet'}
- **Total Prescriptions:** ${prescriptions.length}
- **Active Concerns:** [List 2-3 key concerns based on data]

FORMATTING RULES:
- Use **bold** for emphasis (e.g., **Underweight**, **High Risk**, **Vata Imbalance**)
- Do NOT use emojis anywhere in the response
- Do NOT use **** or multiple asterisks for emphasis - use proper markdown **bold**
- Be specific and evidence-based using the data provided
- Focus on Ayurvedic perspective when analyzing constitution
- Keep the summary concise but comprehensive
- Use bullet points and lists for easy scanning
- If data is missing or insufficient, acknowledge it professionally (e.g., "No trends available yet", "Insufficient data")
- Do not make up information not provided in the data
- Format response in clean Markdown without emojis

Generate the summary now:`;

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();
    
    // Extract metadata from the summary
    const healthTrends = [];
    const riskFactors = [];
    const recommendations = [];
    
    // Simple extraction logic (can be improved)
    const trendMatch = aiResponse.match(/## Key Health Trends\n([\s\S]*?)##/);
    if (trendMatch) {
      const trends = trendMatch[1].match(/- (.*)/g);
      if (trends) {
        // Filter out placeholder text
        const validTrends = trends
          .map(t => t.replace('- ', '').trim())
          .filter(t => !t.toLowerCase().includes('pattern') && 
                       !t.toLowerCase().includes('insufficient data') &&
                       !t.toLowerCase().includes('no significant trends') &&
                       t.length > 10);
        healthTrends.push(...validTrends);
      }
    }
    
    const riskMatch = aiResponse.match(/## Risk Factors & Concerns\n([\s\S]*?)##/);
    if (riskMatch) {
      const risks = riskMatch[1].match(/- \*\*(.*?)\*\*:(.*)/g);
      if (risks) {
        riskFactors.push(...risks.map(r => {
          const match = r.match(/\*\*(.*?)\*\*:(.*)/);
          return match ? `${match[1].trim()}: ${match[2].trim()}` : r.replace('- ', '').trim();
        }));
      } else {
        // Fallback to simple bullet parsing
        const simpleRisks = riskMatch[1].match(/- (.*)/g);
        if (simpleRisks) {
          const validRisks = simpleRisks
            .map(r => r.replace('- ', '').trim())
            .filter(r => !r.toLowerCase().includes('no significant risk') &&
                         !r.toLowerCase().includes('no risk factors') &&
                         r.length > 10);
          riskFactors.push(...validRisks);
        }
      }
    }
    
    const recMatch = aiResponse.match(/## Recommendations for Continued Care\n([\s\S]*?)##/);
    if (recMatch) {
      const recs = recMatch[1].match(/\d+\. (.*)/g);
      if (recs) recommendations.push(...recs.map(r => r.replace(/\d+\. /, '').trim()));
    }
    
    // Update patient record with new summary
    patient.aiSummary = {
      content: aiResponse,
      lastGenerated: new Date(),
      prescriptionCount: prescriptions.length,
      version: (patient.aiSummary?.version || 0) + 1,
      metadata: {
        healthTrends: healthTrends.slice(0, 5),
        riskFactors: riskFactors.slice(0, 5),
        recommendations: recommendations.slice(0, 5),
        treatmentProgress: 'Analysis based on ' + prescriptions.length + ' prescriptions'
      }
    };
    
    await patient.save();
    
    // Cache the summary
    setCachedAISummary(patientId, aiResponse, patient.aiSummary.version);
    
    return {
      content: aiResponse,
      metadata: patient.aiSummary.metadata,
      lastGenerated: patient.aiSummary.lastGenerated,
      version: patient.aiSummary.version
    };
    
  } catch (error) {
    console.error('Error generating AI summary:', error);
    throw error;
  }
};

// API for doctor signup
const signupDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      address,
      registrationNumber,
      phone,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !speciality || !registrationNumber) {
      return res.json({
        success: false,
        message:
          "Name, email, password, speciality, and registration number are required",
      });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Validate password
    if (password.length < 6) {
      return res.json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Check if doctor already exists
    const existingDoctor = await doctorModel.findOne({ email });
    if (existingDoctor) {
      return res.json({
        success: false,
        message: "Doctor with this email already exists",
      });
    }

    // Check if registration number already exists
    const existingRegNumber = await doctorModel.findOne({ registrationNumber });
    if (existingRegNumber) {
      return res.json({
        success: false,
        message: "Doctor with this registration number already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Handle image upload to Cloudinary
    let imageUrl = "";
    if (req.file) {
      const imageUpload = await cloudinary.uploader.upload(req.file.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url;
    }

    // Create address object
    const addressObj = address
      ? { line1: address, line2: "" }
      : { line1: "", line2: "" };

    // Create new doctor
    const doctorData = {
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      speciality,
      degree,
      experience,
      about,
      address: addressObj,
      registrationNumber,
      phone,
      fees: 50, // Default fee
      available: true,
    };

    const newDoctor = new doctorModel(doctorData);
    const savedDoctor = await newDoctor.save();

    res.json({
      success: true,
      message:
        "Doctor account created successfully! Please login with your credentials.",
      doctor: {
        id: savedDoctor._id,
        name: savedDoctor.name,
        email: savedDoctor.email,
      },
    });
  } catch (error) {
    console.error("Doctor signup error:", error);
    res.json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
};

// API for doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await doctorModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.doctorId;

    const appointments = await appointmentModel
      .find({ docId })
      .populate("userId", "name email phone address gender dob image notes")
      .sort({ slotDate: -1, slotTime: -1 });

    // Format appointments to rename userId to userData for frontend compatibility
    const formattedAppointments = appointments.map((apt) => ({
      ...apt.toObject(),
      userData: apt.userId,
      userId: apt.userId._id,
    }));

    res.json({ success: true, appointments: formattedAppointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId, reason } = req.body;
    const docId = req.doctorId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to cancel this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
      status: "cancelled",
      cancellationReason: reason || "Cancelled by doctor",
      cancelledBy: "doctor",
      cancelledAt: new Date(),
    });

    // Clear dashboard cache since appointment status changed
    clearDoctorDashboardCache(docId);

    return res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to undo appointment cancellation
const undoCancellation = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const docId = req.doctorId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to restore this appointment",
      });
    }

    if (!appointmentData.cancelled) {
      return res.json({
        success: false,
        message: "Appointment is not cancelled",
      });
    }

    // Determine the status to restore to based on payment
    const restoredStatus = appointmentData.payment ? "confirmed" : "scheduled";

    // Update appointment and remove cancellation fields
    await appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        cancelled: false,
        status: restoredStatus,
        $unset: {
          cancellationReason: "",
          cancelledBy: "",
          cancelledAt: "",
        },
      },
      { new: true }
    );

    console.log(
      `Appointment ${appointmentId} restored to status: ${restoredStatus}`
    );

    // Clear dashboard cache since appointment status changed
    clearDoctorDashboardCache(docId);

    return res.json({
      success: true,
      message: "Appointment restored successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to confirm appointment (scheduled -> confirmed)
const confirmAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctorId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to confirm this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "confirmed",
      payment: true,
    });

    // Clear dashboard cache since payment/status changed
    clearDoctorDashboardCache(docId);

    return res.json({ success: true, message: "Appointment Confirmed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to start appointment (confirmed -> in-progress)
const startAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctorId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to start this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      status: "in-progress",
      startedAt: new Date(),
    });

    // Clear dashboard cache since appointment status changed
    clearDoctorDashboardCache(docId);

    return res.json({ success: true, message: "Appointment Started" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctorId;

    const appointmentData = await appointmentModel.findById(appointmentId);

    if (!appointmentData) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointmentData.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to complete this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      isCompleted: true,
      status: "completed",
      completedAt: new Date(),
    });

    // Clear dashboard cache since appointment completed (affects earnings)
    clearDoctorDashboardCache(docId);

    return res.json({ success: true, message: "Appointment Completed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark reminder as sent
const markReminderSent = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const docId = req.doctorId;

    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointment.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to update this appointment",
      });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      reminderSent: true,
      reminderSentAt: new Date(),
    });

    // Clear dashboard cache
    clearDoctorDashboardCache(docId);

    return res.json({ 
      success: true, 
      message: "Reminder marked as sent",
      reminderSentAt: new Date()
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to create appointment by doctor
const createAppointmentByDoctor = async (req, res) => {
  try {
    const {
      userId,
      slotDate,
      slotTime,
      appointmentType,
      locationType,
      duration,
      amount,
      paymentMethod,
    } = req.body;
    const docId = req.doctorId;

    // Validate required fields
    if (!userId || !slotDate || !slotTime) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    // Check if patient exists
    const patient = await userModel.findById(userId);
    if (!patient) {
      return res.json({ success: false, message: "Patient not found" });
    }

    // Check if doctor exists
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // Check if slot is already booked
    const existingAppointment = await appointmentModel.findOne({
      docId,
      slotDate,
      slotTime,
      cancelled: false,
    });

    if (existingAppointment) {
      return res.json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    // Create appointment
    const appointmentData = {
      userId,
      docId,
      slotDate,
      slotTime,
      date: Date.now(),
      duration: duration || 45,
      status: "scheduled",
      appointmentType: appointmentType || "consultation",
      locationType: locationType || "clinic",
      amount: amount || doctor.fees,
      paymentMethod: paymentMethod || "cash",
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // Update doctor's slotsBooked array
    await doctorModel.findByIdAndUpdate(docId, {
      $push: { slotsBooked: newAppointment._id },
    });

    // Clear dashboard cache since new appointment created
    clearDoctorDashboardCache(docId);

    res.json({
      success: true,
      message: "Appointment created successfully",
      appointmentId: newAppointment._id,
    });
  } catch (error) {
    console.log("Error creating appointment:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
  try {
    const docId = req.doctorId;

    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
  try {
    const docId = req.doctorId;
    const profileData = await doctorModel.findById(docId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
  try {
    const imageFile = req.file;
    const { fees, address, available, about, degree, experience, phone } = req.body;
    const docId = req.doctorId;

    const updateData = {};
    if (fees !== undefined) updateData.fees = fees;
    if (address !== undefined) updateData.address = address;
    if (available !== undefined) updateData.available = available;
    if (about !== undefined) updateData.about = about;
    if (degree !== undefined) updateData.degree = degree;
    if (experience !== undefined) updateData.experience = experience;
    if (phone !== undefined) updateData.phone = phone;
    // If an image file is provided, upload to cloudinary and set image URL
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
      updateData.image = imageUpload.secure_url;
    }

  await doctorModel.findByIdAndUpdate(docId, updateData);

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const docId = req.doctorId;

    // Check cache first
    const cachedData = getCachedDashboard(docId);
    if (cachedData) {
      return res.json({ 
        success: true, 
        dashData: cachedData,
        cached: true 
      });
    }

    const appointments = await appointmentModel
      .find({ docId })
      .populate("userId", "name email");

    // Calculate earnings for current month only
    let earnings = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        const appointmentDate = new Date(item.slotDate);
        // Check if appointment is in current month and year
        if (
          appointmentDate.getMonth() === currentMonth &&
          appointmentDate.getFullYear() === currentYear
        ) {
          earnings += item.amount;
        }
      }
    });

    let patients = [];

    appointments.map((item) => {
      if (!patients.includes(item.userId._id.toString())) {
        patients.push(item.userId._id.toString());
      }
    });

    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse(),
    };

    // Cache the dashboard data
    setCachedDashboard(docId, dashData);

    res.json({ success: true, dashData, cached: false });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to add a patient for a doctor
const addPatientByDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      gender,
      dob,
      constitution,
      condition,
      foodAllergies,
      notes,
      height,
      weight,
      bowel_movements,
    } = req.body;
    const docId = req.doctorId; // Get from req instead of req.body
    const imageFile = req.file;

    // Validate required fields
    if (!name || !email) {
      return res.json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Validate doctor ID
    if (!docId) {
      return res.json({ success: false, message: "Doctor ID is required" });
    }

    // Check if doctor exists
    const doctor = await doctorModel.findById(docId);
    if (!doctor) {
      return res.json({ success: false, message: "Invalid doctor ID" });
    }

    // Validate email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password if provided, otherwise use a default
    let hashedPassword = "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    } else {
      // Generate a random password for doctor-added patients
      const randomPassword = Math.random().toString(36).slice(-8);
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(randomPassword, salt);
    }

    // Handle image upload
    let imageUrl =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA5uSREBVHgB7d0JchvHFcbxN+C+iaQolmzFsaWqHMA5QXID+wZJTmDnBLZu4BvER4hvYJ/AvoHlimPZRUngvoAg4PkwGJOiuGCd6df9/1UhoJZYJIBvXndPL5ndofljd8NW7bP8y79bZk+tmz8ATFdmu3nWfuiYfdNo2383389e3P5Xb9B82X1qs/YfU3AB1Cuzr+3cnt8U5Mb132i+7n5mc/a9EV4gDF37Z15Qv3/9a/fz63/0VgXOw/uFdexLAxCqLze3s+flL/4IcK/yduwrAxC0zoX9e+u9rJfVXoB7fV41m7u2YQBCt2tt+6v6xEUfeM6+ILyAGxv9QWbL+iPOPxoAX2Zts9GZtU8NgDudln3eyNvQnxgAd/Lw/k194I8NgD+ZPc2aO92uAXCpYQDcIsCAYwQYcIwAA44RYMAxAgw4RoABxwgw4BgBBhwjwIBjBBhwjAADjhFgwDECDDhGgAHHCDDgGAEGHCPAgGOzBlfanfzRNrvo5o8Ls46eO8VDut3i966babz7rMfcjFmWP8/rOTM4Q4ADpjCenZu18sCe52FtX9wczkGUAS+fb6IwK9Tzc/kHI/96gU9H8HiLAnOWh/WsZXZ6fnfYpkEXCT30b0sjr8jz+SdkYb4I8wwdruAQ4AAotCdnRbUdtcJOg74XhbkMtCr08iJhDgkBrkmv0uWV9vgsrNDeRd/z3lHxtSrz0kIe6HlDjQhwxVRtD0+Kfq1n+v5b/Z9lKQ/x8gJVuQ5Zc6fr5PrvWyzBvYuCvLZEkKtEBZ6yFIJbOmkVD4JcHQI8JSkF9zqFWANyalYryJgeAjxh6pAc5ME9OrOkaWDu8LQI8+oSg13TQoAnSKPKe8d+RpWroHvZGrlundOsngYCPAGqurtHl/dL8S5VYnUnqMaTRYDHpL6uKkzVs6Y8Kqux5nKrGjP3enwEeAwHp8VAFYaj8QG1VrbWaFKPi5dvBGoyvz4gvONQNX61X4wbYHQEeEj64O3sp3l7aNI02Nc8KkbtMRqa0EPQXODmIf3dSdPtJrVqHiwbhkQFHpDC++aA8E6L+sW7R4YhUYEHcNy6XIWD6dGtJm1aoMEtRqgHQwW+B+Gtllo6GiBkic1gCPAdrq5/RXX0utOcHgwBvkXZ50U9dJ+YEN+PAN9AA1UabWZOc73UJ+YW090I8DXlJA1Gm8OgW0xHp4ZbEOBrdpnXHJz9RNdVD4IAX6G5zawoChMX1psR4L5yBw2ESeFlUOtdBNgul7khbGpG0x9+GwG2YqST5pkP6g9rthYKyQdYG6ufsKTNFZrSl5IOsKruIU0ydzTJhvvDhaQDTNPZL7WceO8SDrDefJrOfnW6NKUl2eWEmioZi0b/TN/FhfwN7Z8c2Ji5/PPz/qmHZ6f9s4Yjudddns80n/Ci2CR/dDW/zp2PZCq0G+tmaytFcBtDtKUU4OO8+7C3n9+Wcd6XVDdI64dTlWSAPQ9cKahbm2YPN4YL7VVzebVe1+NBEeadN0WYPUq9Cid3OqGqr05P8OhhHtzth6MH9y4KsILssXmt8KZahZMbxPJafR9v549H0wmvqBp/9KeiOntTVuEUJRVgzXf2eOtB4VWTedoU3mcf+gxxqveFkwqwx8UKj7aqCW9JI9iqxA1nn4xUq3AyAVbl9fYGqxKqz1vHv/vkPXMnxYUOyQTYYxPryWOrjW5PrTg7nFsX6NR2s0wmwN6q7/JS8aiTmu+eaLLKcWIHqycRYI+DVxsPrHa6gHjrC6e2o0oSAT5xeFVeDuScoBAuJMNoOb3TMKo0KrCzq/LCQj6QFMjMolAuJMNI6cjS6AOs5rO3/Z1Dmha4OG/upNSMjj/ADq/GqsCh0C0lj/eEUxmNjj7AHm/uhzYTambG3EllrXfUAdZghsdlgzNsNTi2VDa+i/qjcs5u/hPhcaleKtMqow6w1zcxtNsgHl9HtbxS6AfHXYGdNqM6gX3fF05fR++7rgwi6gB77QeF1PRXa6DjdGJECl2oaAOsq6/X831D2hXjzPHcYiqwY54P5z4OaOXUqeMleimMREcbYM9vnpqtoYT40PHeyynMiY42wF4HXkpHAWy8p6a8521n1QqLfSQ63gA7v/o2d6123veMFs9dqUHQBw5U70DrmvdqfvXG3Iu9GR1tgGNoOtUZIF08YjiCJfaBLCpwwBSgN02rnO77xlB9U0AFDpyCVPWEhJ3X8RyAxiCWU7EMXqgP9/Mv1c2GUsV/E8AA2qQwiIXanZ6Z/bpjU6d/57dXBkcSPlnVl/L0wGntFa2JI//7xeAMAXZEIdbc5A+eTHbTOzWbqbw+0YR2Rs3cn36ezD1iDVTpv0V4/Yq2Amtbmlhv4it4L38rRqgfPRx+72YNiL3uD1Z5XSo4qNi3J6IJ7djVIOsUhbXVYvub67taKqT6u4fHxeKEkFY7YTzRBriR5RXY0qBw7p1fDnRJubOlFnXEXmXvMutwR81hRN2ETmFB921imYiBu0XbQ8gyA6LvA0f747G3MoQAO0WAMRd5/1ei/ZiHcrof6pNCNyrqQayUXD1P6aaTFMrN2VMalU6hAkd9Gy...";
    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      imageUrl = imageUpload.secure_url;
    }

    // Parse address if provided as string
    let parsedAddress = address;
    if (address && typeof address === "string") {
      try {
        parsedAddress = JSON.parse(address);
      } catch {
        parsedAddress = {
          line1: address,
          line2: "",
          city: "",
          state: "",
          pincode: "",
          country: "",
        };
      }
    }

    // Parse height if provided as string
    let parsedHeight = { feet: 0, inches: 0 };
    if (height) {
      if (typeof height === "string") {
        try {
          parsedHeight = JSON.parse(height);
        } catch {
          parsedHeight = { feet: 0, inches: 0 };
        }
      } else {
        parsedHeight = height;
      }
    }

    const patientData = {
      name,
      email,
      password: hashedPassword,
      image: imageUrl,
      phone: phone || "000000000",
      address: parsedAddress || {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        country: "",
      },
      gender: gender || "Not Selected",
      dob: dob ? new Date(dob) : new Date(),
      constitution: constitution || "",
      condition: condition || "",
      foodAllergies: foodAllergies || "",
      notes: notes || "",
      height: parsedHeight,
      weight: weight ? parseFloat(weight) : 0,
      bowel_movements: bowel_movements || "",
      doctor: docId, // Associate patient with the doctor who added them
    };

    const newPatient = new userModel(patientData);
    const savedPatient = await newPatient.save();

    // Clear dashboard cache since new patient added
    clearDoctorDashboardCache(docId);

    res.json({
      success: true,
      message: "Patient added successfully",
      patient: { ...savedPatient.toObject(), password: undefined },
    });
  } catch (error) {
    console.log("Error in addPatientByDoctor:", error);

    // Check if it's a validation error
    if (error.name === "ValidationError") {
      console.log("Validation errors:", error.errors);
      return res.json({
        success: false,
        message: `Validation error: ${Object.keys(error.errors)
          .map((key) => error.errors[key].message)
          .join(", ")}`,
      });
    }

    res.json({ success: false, message: error.message });
  }
};

// API to update patient details by doctor
const updatePatientByDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;
    const docId = req.doctorId;
    const updates = { ...req.body };

    // Validate patientId
    if (!patientId || patientId === "undefined") {
      console.error("Invalid patient ID received:", patientId);
      return res.json({ success: false, message: "Invalid patient ID" });
    }

    // Verify doctor has access to this patient (either through appointment or direct assignment)
    const hasAppointment = await appointmentModel.exists({
      docId,
      userId: patientId,
    });
    const isAssignedDoctor = await userModel.exists({
      _id: patientId,
      doctor: docId,
    });

    if (!hasAppointment && !isAssignedDoctor) {
      return res.json({
        success: false,
        message: "Unauthorized access to patient",
      });
    }

    console.log("Updates received:", updates);

    // Parse address if provided as string
    if (updates.address && typeof updates.address === "string") {
      try {
        updates.address = JSON.parse(updates.address);
      } catch {
        // Keep as is if parsing fails
      }
    }

    // Parse height if provided as string
    if (updates.height && typeof updates.height === "string") {
      try {
        updates.height = JSON.parse(updates.height);
      } catch {
        // Keep as is if parsing fails
      }
    }

    // Parse weight if provided
    if (updates.weight) {
      updates.weight = parseFloat(updates.weight);
    }

    // Parse date if provided
    if (updates.dob) {
      updates.dob = new Date(updates.dob);
    }

    // Handle password change
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    // Remove docId from updates to prevent updating it
    delete updates.docId;

    const patient = await userModel
      .findByIdAndUpdate(patientId, updates, { new: true })
      .select("-password");

    if (!patient) {
      return res.json({ success: false, message: "Patient not found" });
    }

    res.json({ success: true, patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get patients assigned to a doctor using the new user schema
const getPatients = async (req, res) => {
  try {
    const docId = req.doctorId;

    // Get patients directly where this doctor is assigned
    const patients = await userModel
      .find({ doctor: docId })
      .select("-password")
      .sort({ createdAt: -1 });

    // Format the patient data for frontend
    const formattedPatients = patients.map((patient) => {
      // Calculate age if DOB is provided
      let age = "N/A";
      if (patient.dob) {
        const birthDate = new Date(patient.dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
      }

      return {
        _id: patient._id,
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone || "Not provided",
        age: age,
        dob: patient.dob,
        gender: patient.gender || "Not Selected",
        constitution: patient.constitution || "Not assessed",
        condition: patient.condition || "",
        foodAllergies: patient.foodAllergies || "",
        notes: patient.notes || "",
        height: patient.height || { feet: 0, inches: 0 },
        weight: patient.weight || 0,
        bowel_movements: patient.bowel_movements || "",
        address: patient.address || {
          line1: "",
          line2: "",
          city: "",
          state: "",
          pincode: "",
          country: "India",
        },
        addressDisplay:
          `${patient.address?.line1 || ""} ${
            patient.address?.line2 || ""
          }`.trim() || "Not provided",
        registrationDate: patient.createdAt,
        status: "Active",
        image: patient.image,
      };
    });

    res.json({ success: true, patients: formattedPatients });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to email prescription to patient
const emailPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const doctorId = req.doctorId;

    // Find the prescription and populate patient info
    const prescription = await prescriptionModel.findById(prescriptionId);

    if (!prescription) {
      return res.json({ success: false, message: "Prescription not found" });
    }

    // Get doctor info
    const doctor = await doctorModel.findById(doctorId);
    if (!doctor) {
      return res.json({ success: false, message: "Doctor not found" });
    }

    // Get patient email - check if patientId exists, otherwise use patientInfo.email
    let patientEmail = prescription.patientInfo?.email;

    if (prescription.patientId) {
      const patient = await userModel.findById(prescription.patientId);
      if (patient && patient.email) {
        patientEmail = patient.email;
      }
    }

    if (!patientEmail) {
      return res.json({ success: false, message: "Patient email not found" });
    }

    // Generate PDF
    console.log("Generating PDF for prescription:", prescriptionId);
    const { buffer, filename } = await generatePrescriptionPDF(prescription, {
      name: doctor.name,
      speciality: doctor.speciality,
      email: doctor.email,
    });

    // Generate email HTML
    const emailHTML = getPrescriptionEmailTemplate(prescription, {
      name: doctor.name,
      speciality: doctor.speciality,
      email: doctor.email,
    });

    // Determine from address based on email service
    let fromAddress;
    if (process.env.EMAIL_SERVICE === "ethereal" || !process.env.EMAIL_USER) {
      // For Ethereal, use a default sender (Ethereal will override with test account)
      fromAddress = `"${doctor.name} - Ayurvedic Health Center" <noreply@ayurveda.com>`;
    } else {
      fromAddress = `"${doctor.name} - Ayurvedic Health Center" <${process.env.EMAIL_USER}>`;
    }

    // Send email with PDF buffer (Vercel compatible - no filesystem)
    const mailOptions = {
      from: fromAddress,
      to: patientEmail,
      subject: `Your Ayurvedic Prescription - ${prescription.prescriptionId}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Prescription_${prescription.prescriptionId}.pdf`,
          content: buffer, // Use buffer instead of path
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Update prescription with emailedAt timestamp
    prescription.emailedAt = new Date();
    await prescription.save();

    res.json({
      success: true,
      message: "Prescription emailed successfully",
      emailedAt: prescription.emailedAt,
    });
  } catch (error) {
    console.error("Error emailing prescription:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to update appointment by doctor
const updateAppointmentByDoctor = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const {
      userId,
      slotDate,
      slotTime,
      appointmentType,
      locationType,
      duration,
      amount,
      paymentMethod,
      status,
    } = req.body;
    const docId = req.doctorId;

    // Validate required fields
    if (!slotDate || !slotTime) {
      return res.json({
        success: false,
        message: "Date and time are required",
      });
    }

    // Check if appointment exists and belongs to this doctor
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.json({ success: false, message: "Appointment not found" });
    }

    if (appointment.docId.toString() !== docId.toString()) {
      return res.json({
        success: false,
        message: "Unauthorized to update this appointment",
      });
    }

    // Check if new slot is already booked (if slot time changed)
    if (
      appointment.slotDate !== slotDate ||
      appointment.slotTime !== slotTime
    ) {
      const existingAppointment = await appointmentModel.findOne({
        _id: { $ne: appointmentId }, // Exclude current appointment
        docId,
        slotDate,
        slotTime,
        cancelled: false,
      });

      if (existingAppointment) {
        return res.json({
          success: false,
          message: "This time slot is already booked",
        });
      }
    }

    // Update appointment
    const updateData = {
      slotDate,
      slotTime,
      appointmentType: appointmentType || appointment.appointmentType,
      locationType: locationType || appointment.locationType,
      duration: duration || appointment.duration,
      paymentMethod: paymentMethod || appointment.paymentMethod,
    };

    if (amount !== undefined) {
      updateData.amount = amount;
    }

    // Update status if provided
    if (status) {
      updateData.status = status;
      // Update related fields based on status
      if (status === "confirmed") {
        updateData.payment = true;
      } else if (status === "completed") {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      } else if (status === "cancelled") {
        updateData.cancelled = true;
        updateData.cancelledBy = "doctor";
        updateData.cancelledAt = new Date();
      }
    }

    const updatedAppointment = await appointmentModel.findByIdAndUpdate(
      appointmentId,
      updateData,
      { new: true }
    );

    // Clear dashboard cache since appointment details changed
    clearDoctorDashboardCache(docId);

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.log("Error updating appointment:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get food database for diet chart with caching
const getFoodDatabase = async (req, res) => {
  try {
    const now = Date.now();

    // Check if cache is valid
    if (
      foodCache.data &&
      foodCache.timestamp &&
      now - foodCache.timestamp < foodCache.ttl
    ) {
      return res.json({
        success: true,
        foods: foodCache.data,
        cached: true,
        cacheVersion: foodCache.version,
        cacheAge: Math.floor((now - foodCache.timestamp) / 1000 / 60 / 60 / 24), // age in days
        cacheExpiry: new Date(
          foodCache.timestamp + foodCache.ttl
        ).toISOString(),
      });
    }

    // Cache miss or expired - fetch from database

    // Use aggregation to get only unique foods based on name and serving unit
    const foods = await foodModel.aggregate([
      {
        // Group by name and serving unit to get unique combinations
        $group: {
          _id: {
            name: "$name",
            serving_unit: "$serving_size.unit",
          },
          // Keep the first document for each unique combination
          doc: { $first: "$$ROOT" },
        },
      },
      {
        // Replace root with the original document
        $replaceRoot: { newRoot: "$doc" },
      },
      {
        // Sort by name for consistent ordering
        $sort: { name: 1 },
      },
    ]);

    // Update cache
    foodCache.data = foods;
    foodCache.timestamp = now;

    res.json({
      success: true,
      foods,
      cached: false,
      cacheVersion: foodCache.version,
      totalItems: foods.length,
    });
  } catch (error) {
    console.log("Error fetching food database:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to clear food cache (useful for admin updates)
const clearFoodCache = () => {
  foodCache.data = null;
  foodCache.timestamp = null;
};

// API to create a new diet chart
const createDietChart = async (req, res) => {
  try {
    const {
      patientId,
      patientDetails,
      weeklyMealPlan,
      customNutritionGoals,
      prescriptionId,
      specialInstructions,
      dietaryRestrictions,
    } = req.body;

    const doctorId = req.body.docId; // From auth middleware

    // Validate required fields
    if (!patientId || !patientDetails || !weeklyMealPlan) {
      return res.json({
        success: false,
        message:
          "Patient ID, patient details, and weekly meal plan are required",
      });
    }

    // Transform weekly meal plan to store complete food details (not references)
    const transformedMealPlan = {};
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const meals = ["Breakfast", "Lunch", "Snacks", "Dinner"];

    days.forEach((day) => {
      transformedMealPlan[day] = {};
      meals.forEach((meal) => {
        if (weeklyMealPlan[day] && weeklyMealPlan[day][meal]) {
          transformedMealPlan[day][meal] = weeklyMealPlan[day][meal].map(
            (food) => ({
              food_id: food._id || food.id, // Original food ID for reference
              name: food.name,
              category: food.category,
              amount: food.amount,
              serving_unit: food.serving_unit || food.serving_size?.unit || "g",
              calculated_nutrition: {
                calories:
                  food.nutrition?.calories ||
                  food.calculated_nutrition?.calories ||
                  0,
                protein:
                  food.nutrition?.protein ||
                  food.calculated_nutrition?.protein ||
                  0,
                carbs:
                  food.nutrition?.carbs ||
                  food.calculated_nutrition?.carbs ||
                  0,
                fat: food.nutrition?.fat || food.calculated_nutrition?.fat || 0,
                fiber:
                  food.nutrition?.fiber ||
                  food.calculated_nutrition?.fiber ||
                  0,
              },
              vitamins: {
                vitamin_a:
                  food.vitamins?.vitamin_a_mcg || food.vitamins?.vitamin_a || 0,
                vitamin_b1:
                  food.vitamins?.vitamin_b1_mg ||
                  food.vitamins?.vitamin_b1 ||
                  0,
                vitamin_b2:
                  food.vitamins?.vitamin_b2_mg ||
                  food.vitamins?.vitamin_b2 ||
                  0,
                vitamin_b6:
                  food.vitamins?.vitamin_b6_mg ||
                  food.vitamins?.vitamin_b6 ||
                  0,
                vitamin_b12:
                  food.vitamins?.vitamin_b12_mcg ||
                  food.vitamins?.vitamin_b12 ||
                  0,
                vitamin_c:
                  food.vitamins?.vitamin_c_mg || food.vitamins?.vitamin_c || 0,
                vitamin_d:
                  food.vitamins?.vitamin_d_mcg || food.vitamins?.vitamin_d || 0,
                vitamin_e:
                  food.vitamins?.vitamin_e_mg || food.vitamins?.vitamin_e || 0,
                folate: food.vitamins?.folate_mcg || food.vitamins?.folate || 0,
              },
              minerals: {
                calcium:
                  food.minerals?.calcium_mg || food.minerals?.calcium || 0,
                iron: food.minerals?.iron_mg || food.minerals?.iron || 0,
                magnesium:
                  food.minerals?.magnesium_mg || food.minerals?.magnesium || 0,
                phosphorus:
                  food.minerals?.phosphorus_mg ||
                  food.minerals?.phosphorus ||
                  0,
                potassium:
                  food.minerals?.potassium_mg || food.minerals?.potassium || 0,
                sodium: food.minerals?.sodium_mg || food.minerals?.sodium || 0,
                zinc: food.minerals?.zinc_mg || food.minerals?.zinc || 0,
              },
            })
          );
        } else {
          transformedMealPlan[day][meal] = [];
        }
      });
    });

    // Create new diet chart
    const dietChart = new dietChartModel({
      patient_id: patientId,
      doctor_id: doctorId,
      prescription_id: prescriptionId || null,
      patient_snapshot: {
        age: patientDetails.age,
        constitution: patientDetails.constitution,
        primary_health_condition: patientDetails.primaryHealthCondition,
        current_symptoms: patientDetails.currentSymptoms,
        food_allergies: patientDetails.foodAllergies,
        health_goals: patientDetails.healthGoals || [],
      },
      custom_nutrition_goals: customNutritionGoals || {
        macronutrients: {
          calories: 2000,
          protein: 50,
          carbs: 250,
          fat: 65,
          fiber: 25,
        },
        vitamins: {
          vitamin_a: 700,
          vitamin_b1: 1.1,
          vitamin_b2: 1.1,
          vitamin_b3: 14,
          vitamin_b6: 1.3,
          vitamin_b12: 2.4,
          vitamin_c: 75,
          vitamin_d: 15,
          vitamin_e: 15,
          vitamin_k: 90,
          folate: 400,
        },
        minerals: {
          calcium: 1000,
          iron: 10,
          magnesium: 310,
          phosphorus: 700,
          potassium: 2600,
          sodium: 1500,
          zinc: 8,
        },
      },
      weekly_meal_plan: transformedMealPlan,
      special_instructions: specialInstructions,
      dietary_restrictions: dietaryRestrictions || [],
      status: "active",
    });

    // Calculate nutrition summary
    dietChart.calculateNutritionSummary();

    // Save to database
    await dietChart.save();

    res.json({
      success: true,
      message: "Diet chart created successfully",
      dietChartId: dietChart._id,
      dietChart,
    });
  } catch (error) {
    console.log("Error creating diet chart:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get diet charts for a specific patient
const getDietChartsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;

    const dietCharts = await dietChartModel
      .find({ patient_id: patientId })
      .sort({ created_at: -1 })
      .populate("doctor_id", "name speciality")
      .populate("prescription_id");

    res.json({
      success: true,
      count: dietCharts.length,
      dietCharts,
    });
  } catch (error) {
    console.log("Error fetching diet charts:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get diet charts created by doctor
const getDietChartsByDoctor = async (req, res) => {
  try {
    const doctorId = req.body.docId; // From auth middleware
    const { limit = 20, status } = req.query;

    const query = { doctor_id: doctorId };
    if (status) {
      query.status = status;
    }

    const dietCharts = await dietChartModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("patient_id", "name email phone age gender");

    res.json({
      success: true,
      count: dietCharts.length,
      dietCharts,
    });
  } catch (error) {
    console.log("Error fetching diet charts:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get a specific diet chart by ID
const getDietChartById = async (req, res) => {
  try {
    const { chartId } = req.params;

    let dietChart = await dietChartModel
      .findById(chartId)
      .populate("patient_id", "name email phone age gender")
      .populate("doctor_id", "name speciality email")
      .populate("prescription_id");

    if (!dietChart) {
      return res.json({
        success: false,
        message: "Diet chart not found",
      });
    }

    // Convert to object and return - foods are already stored with complete details
    const chartObject = dietChart.toObject();

    // Log food counts for debugging
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const meals = ["Breakfast", "Lunch", "Snacks", "Dinner"];

    days.forEach((day) => {
      meals.forEach((meal) => {
        if (
          chartObject.weekly_meal_plan[day] &&
          chartObject.weekly_meal_plan[day][meal]
        ) {
          // Count items in meal
        }
      });
    });

    res.json({
      success: true,
      dietChart: chartObject,
    });
  } catch (error) {
    console.log("Error fetching diet chart:", error);
    console.error("Error stack:", error.stack);
    res.json({ success: false, message: error.message });
  }
};

// API to update a diet chart
const updateDietChart = async (req, res) => {
  try {
    const { chartId } = req.params;
    const updateData = req.body;
    const doctorId = req.body.docId; // From auth middleware

    // Find the diet chart
    const dietChart = await dietChartModel.findById(chartId);

    if (!dietChart) {
      return res.json({
        success: false,
        message: "Diet chart not found",
      });
    }

    // Verify doctor owns this chart
    if (dietChart.doctor_id.toString() !== doctorId) {
      return res.json({
        success: false,
        message: "Unauthorized to update this diet chart",
      });
    }

    // Update fields
    if (updateData.weeklyMealPlan) {
      dietChart.weekly_meal_plan = updateData.weeklyMealPlan;
      dietChart.calculateNutritionSummary();
    }
    if (updateData.specialInstructions !== undefined) {
      dietChart.special_instructions = updateData.specialInstructions;
    }
    if (updateData.dietaryRestrictions) {
      dietChart.dietary_restrictions = updateData.dietaryRestrictions;
    }
    if (updateData.status) {
      dietChart.status = updateData.status;
    }

    await dietChart.save();

    res.json({
      success: true,
      message: "Diet chart updated successfully",
      dietChart,
    });
  } catch (error) {
    console.log("Error updating diet chart:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to delete a diet chart
const deleteDietChart = async (req, res) => {
  try {
    const { chartId } = req.params;
    const doctorId = req.body.docId; // From auth middleware
    const { hardDelete } = req.query; // Optional query param for permanent deletion

    // Find the diet chart
    const dietChart = await dietChartModel.findById(chartId);

    if (!dietChart) {
      return res.json({
        success: false,
        message: "Diet chart not found",
      });
    }

    // Verify doctor owns this chart
    if (dietChart.doctor_id.toString() !== doctorId) {
      return res.json({
        success: false,
        message: "Unauthorized to delete this diet chart",
      });
    }

    if (hardDelete === "true") {
      // Permanent deletion
      await dietChartModel.findByIdAndDelete(chartId);
      res.json({
        success: true,
        message: "Diet chart permanently deleted",
      });
    } else {
      // Soft delete - mark as discontinued
      dietChart.status = "discontinued";
      await dietChart.save();
      res.json({
        success: true,
        message: "Diet chart discontinued successfully",
      });
    }
  } catch (error) {
    console.log("Error deleting diet chart:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to generate AI diet chart using Vector DB + Gemini
const generateAIDietChart = async (req, res) => {
  try {
    const { patientDetails, customNutritionGoals } = req.body;

    // Validate required fields
    if (!patientDetails) {
      return res.json({
        success: false,
        message: "Patient details are required",
      });
    }

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  // Query vector database for top 150 most relevant foods for maximum variety (reduced from 500 for performance)
  const relevantFoods = await queryRelevantFoods(patientDetails, 150);

    // Generate custom nutrition goals if not provided or if all values are 0
    let nutritionGoals = customNutritionGoals;

    // Check if goals are all 0 (default) - if so, let AI calculate them
    const hasManualGoals =
      nutritionGoals &&
      nutritionGoals.macronutrients &&
      (nutritionGoals.macronutrients.calories > 0 ||
        nutritionGoals.macronutrients.protein > 0 ||
        nutritionGoals.macronutrients.carbs > 0);

    // Build the AI prompt (no food data, foods are already in vector DB context)
    const prompt = buildGeminiDietPrompt(
      patientDetails,
      nutritionGoals,
      relevantFoods
    );

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    // Parse the AI response
    const parsedResponse = parseAIDietResponse(
      aiResponse,
      relevantFoods,
      nutritionGoals
    );

    res.json({
      success: true,
      customNutritionGoals: parsedResponse.nutritionGoals || nutritionGoals,
      weeklyMealPlan: parsedResponse.weeklyMealPlan,
      explanation: parsedResponse.explanation,
      considerations: parsedResponse.considerations,
    });
  } catch (error) {
    console.log("Error generating AI diet chart:", error);
    res.json({
      success: false,
      message: error.message || "Failed to generate AI diet chart",
    });
  }
};

// Helper function to build Gemini diet prompt
function buildGeminiDietPrompt(patientDetails, nutritionGoals, relevantFoods) {
  // Check if manual goals are provided
  const hasManualGoals =
    nutritionGoals &&
    nutritionGoals.macronutrients &&
    nutritionGoals.macronutrients.calories > 0;

  // Create simplified food list for context with better categorization
  const foodList = relevantFoods
    .slice(0, 150)
    .map(
      (f) =>
        `${f.name} (${f.category}): ${
          f.macronutrients?.calories_kcal || 0
        } kcal, ${f.macronutrients?.proteins_g || 0}g protein, ${
          f.macronutrients?.carbohydrates_g || 0
        }g carbs, ${f.macronutrients?.fats_g || 0}g fat, ${
          f.macronutrients?.fiber_g || 0
        }g fiber`
    )
    .join("\n");

  return `Create a personalized 7-day Ayurvedic diet chart for the following patient:

PATIENT PROFILE:
- Name: ${patientDetails.patientName}
- Age: ${patientDetails.age} years, Gender: ${patientDetails.gender}
- Constitution (Prakriti): ${patientDetails.constitution}
- Height: ${patientDetails.height?.feet || 0}ft ${
    patientDetails.height?.inches || 0
  }in
- Weight: ${patientDetails.weight || 0}kg
- BMI: ${patientDetails.bmi || "Not calculated"}
- Bowel Movements: ${patientDetails.bowel_movements || "Normal"}
- Health Condition: ${
    patientDetails.primaryHealthCondition || "General wellness"
  }
- Current Symptoms: ${patientDetails.currentSymptoms || "None"}
- **CRITICAL - FOOD ALLERGIES/RESTRICTIONS: ${
    patientDetails.foodAllergies || "None"
  }**
  ${
    patientDetails.foodAllergies
      ? `**YOU MUST COMPLETELY AVOID ALL FOODS CONTAINING: ${patientDetails.foodAllergies}**`
      : ""
  }

${
  hasManualGoals
    ? `
DAILY NUTRITION TARGETS (STRICT LIMITS - NEVER EXCEED 100%):
**CRITICAL: These are MAXIMUM limits set by the doctor. Stay BELOW these values, ideally at 90-98%. DO NOT GO BELOW 90%**

HARD LIMITS (DO NOT EXCEED UNDER ANY CIRCUMSTANCE):
- Calories: MAXIMUM ${
        nutritionGoals.macronutrients.calories
      } kcal (Target: ${Math.round(
        nutritionGoals.macronutrients.calories * 0.9
      )}-${Math.round(nutritionGoals.macronutrients.calories * 0.98)} kcal)
- Protein: MAXIMUM ${
        nutritionGoals.macronutrients.protein
      }g (Target: ${Math.round(
        nutritionGoals.macronutrients.protein * 0.9
      )}-${Math.round(nutritionGoals.macronutrients.protein * 0.98)}g)
- Carbohydrates: MAXIMUM ${
        nutritionGoals.macronutrients.carbs
      }g (Target: ${Math.round(
        nutritionGoals.macronutrients.carbs * 0.9
      )}-${Math.round(nutritionGoals.macronutrients.carbs * 0.98)}g)
- Fat: MAXIMUM ${nutritionGoals.macronutrients.fat}g (Target: ${Math.round(
        nutritionGoals.macronutrients.fat * 0.9
      )}-${Math.round(nutritionGoals.macronutrients.fat * 0.98)}g)
- Fiber: MAXIMUM ${nutritionGoals.macronutrients.fiber}g (Target: ${Math.round(
        nutritionGoals.macronutrients.fiber * 0.9
      )}-${Math.round(nutritionGoals.macronutrients.fiber * 0.98)}g)
- Vitamins & Minerals: MAXIMUM ${
        nutritionGoals.vitamins.vitamin_c
      }mg Vitamin C, ${nutritionGoals.vitamins.vitamin_d}mcg Vitamin D, ${
        nutritionGoals.vitamins.vitamin_a
      }mcg Vitamin A, ${nutritionGoals.minerals.calcium}mg Calcium, ${
        nutritionGoals.minerals.iron
      }mg Iron, ${nutritionGoals.minerals.potassium}mg Potassium
  (Target 90-98% for ALL vitamins and minerals - DO NOT exceed 100%)

**ADJUSTMENT STRATEGY:** If you're approaching limits, REDUCE portion sizes rather than removing foods to maintain variety.
`
    : `
TASK - CALCULATE NUTRITION GOALS:
**FIRST, you MUST calculate personalized daily nutrition targets based on the patient's profile:**



**YOU MUST show your calculated nutrition goals at the beginning of your response in this EXACT format:**

CALCULATED NUTRITION GOALS:
- Calories: XXXX kcal
- Protein: XXg
- Carbohydrates: XXXg
- Fat: XXg
- Fiber: XXg
- Vitamin A: XXX mcg
- Vitamin B1: X.X mg
- Vitamin B2: X.X mg
- Vitamin B3: XX mg
- Vitamin B6: X.X mg
- Vitamin B12: X.X mcg
- Vitamin C: XX mg
- Vitamin D: XX mcg
- Vitamin E: XX mg
- Vitamin K: XX mcg
- Folate: XXX mcg
- Calcium: XXXX mg
- Iron: XX mg
- Magnesium: XXX mg
- Phosphorus: XXX mg
- Potassium: XXXX mg
- Sodium: XXXX mg
- Zinc: XX mg

Then create the meal plan targeting 95-98% of these calculated values (NEVER exceed 100%).
`
}

TOP 500 RECOMMENDED FOODS FOR THIS PATIENT (Already filtered to exclude allergens):
${foodList}

**ABSOLUTE FOOD RESTRICTIONS - VIOLATION WILL HARM PATIENT:**
${
  patientDetails.foodAllergies
    ? `
DO NOT INCLUDE ANY OF THESE ITEMS OR INGREDIENTS: ${patientDetails.foodAllergies}
CROSS-CHECK EVERY FOOD ITEM BEFORE INCLUDING IT IN THE MEAL PLAN.
If you're unsure whether a food contains an allergen, DO NOT include it.
Example: If patient is allergic to "dairy" or is "lactose intolerent", exclude Milk, Paneer, Ghee, Butter, Yogurt, Cheese, etc.
Example: If patient is allergic to "nuts", exclude Almonds, Cashews, Walnuts, Peanuts, etc.
Example: If patient is allergic to "gluten", exclude Wheat, Barley, Rye, and all wheat-based products.
`
    : "No food restrictions"
}

CRITICAL INSTRUCTIONS - MUST FOLLOW EXACTLY:
1. ${
    !hasManualGoals
      ? "**FIRST: Calculate and display nutrition goals in the EXACT format shown below**"
      : "Use the provided nutrition targets"
  }
2. **FORMAT RULE: All food items for a meal MUST be on ONE line, separated by commas - NO bullet points, NO separate lines per food**
3. Create a complete 7-day meal plan (Monday-Sunday)
4. Each day MUST have ALL 4 meals: Breakfast, Lunch, Snacks, Dinner
5. EVERY meal slot MUST contain 2-4 food items (NO empty meals, NO single food meals)
6. **USE EXACT FOOD NAMES from the list above - DO NOT paraphrase or modify names**
7. Each food item must specify amount in grams/ml (e.g., "Brown Rice (150g)", "Milk (200ml)")
8. **LIMIT LIQUIDS: Maximum ONE liquid per meal (Water, Milk, Tea, etc.) - NOT 2 or 3 liquids**
9. MAXIMIZE VARIETY: Use each food item maximum 2-3 times across the entire week
10. NEVER repeat the same food in the same day
11. Daily totals MUST achieve 95-98% of ALL nutrition targets
12. **CRITICAL HARD LIMIT: NEVER EXCEED 100% of ANY macronutrient. If approaching limit, REDUCE portion sizes immediately**
13. Balance doshas according to patient's constitution: ${
    patientDetails.constitution
  }
14. **CRITICAL FOOD RESTRICTIONS - ABSOLUTE REQUIREMENT:**
    ${patientDetails.foodAllergies || "None"}
    **TRIPLE CHECK every food item against allergies before including it in the plan**
15. **COOKING VARIETY: Use different cooking methods - NOT all boiled**
16. **MANDATORY: Include Ayurvedic properties for EVERY food item in the format: FoodName (XXXg/ml) [Rasa: sweet|Virya: hot|Dosha: balances vata]**

MEAL COMPOSITION GUIDELINES:
- Breakfast: 30% of daily calories (2-4 items: 1 grain + 1 protein + 1 fruit/vegetable + optional liquid)
- Lunch: 25% of daily calories (2-4 items: 1 grain + 1 protein + 1-2 vegetables)
- Snacks: 10% of daily calories (2-3 items: 1-2 fruits/nuts + optional liquid)
- Dinner: 35% of daily calories (2-4 items: 1 grain + 1 protein + 1-2 vegetables)

**BALANCED VARIETY ACROSS WEEK:**
- Fruits: 7-10 different fruits
- Vegetables: 12-15 different vegetables
- Grains: 5-7 different grains
- Proteins: 5-7 different protein sources
- Liquids: Maximum 1 per meal (not all meals need liquid)
- Cooking Methods: Rotate between steamed, sautéed, grilled, roasted, raw, boiled

OUTPUT FORMAT (EXACTLY AS SHOWN):
${
  !hasManualGoals
    ? `
CALCULATED NUTRITION GOALS:
- Calories: XXXX kcal
- Protein: XXg
- Carbohydrates: XXXg
- Fat: XXg
- Fiber: XXg
- Vitamin A: XXX mcg
- Vitamin B1: X.X mg
- Vitamin B2: X.X mg
- Vitamin B3: XX mg
- Vitamin B6: X.X mg
- Vitamin B12: X.X mcg
- Vitamin C: XX mg
- Vitamin D: XX mcg
- Vitamin E: XX mg
- Vitamin K: XX mcg
- Folate: XXX mcg
- Calcium: XXXX mg
- Iron: XX mg
- Magnesium: XXX mg
- Phosphorus: XXX mg
- Potassium: XXXX mg
- Sodium: XXXX mg
- Zinc: XX mg

`
    : ""
}**CRITICAL OUTPUT FORMAT RULES:**
1. NO MARKDOWN BULLETS (* or -) - Use plain text with double asterisks for days/meals only
2. Each day starts with **DayName:** (e.g., **Monday:**)
3. Each meal line starts with - **MealName:** (e.g., - **Breakfast:**)
4. Food items on SAME LINE as meal, separated by commas
5. DO NOT put each food on a new line with bullets

**Monday:**
- **Breakfast:** FoodName1 (XXXg/ml) [Rasa: sweet|Virya: hot|Dosha: balances vata], FoodName2 (XXg/ml) [Rasa: sweet|Virya: cold|Dosha: balances pitta], FoodName3 (XXg/ml) [Rasa: pungent|Virya: hot|Dosha: balances kapha]
- **Lunch:** FoodName1 (XXXg/ml) [Properties], FoodName2 (XXXg/ml) [Properties], FoodName3 (XXXg/ml) [Properties]
- **Snacks:** FoodName1 (XXg/ml) [Properties], FoodName2 (XXg/ml) [Properties]
- **Dinner:** FoodName1 (XXXg/ml) [Properties], FoodName2 (XXg/ml) [Properties], FoodName3 (XXXg/ml) [Properties]

**Tuesday:**
- **Breakfast:** [Different foods, all on ONE line, comma-separated]
- **Lunch:** [Different foods, all on ONE line, comma-separated]
- **Snacks:** [Different foods, all on ONE line, comma-separated]
- **Dinner:** [Different foods, all on ONE line, comma-separated]

[Continue for all 7 days with SAME FORMAT]

**WRONG FORMAT (DO NOT USE):**
**Monday:**
*   **Breakfast:**
    *   FoodName1 (100g) [Properties]  ← WRONG - Don't put foods on separate lines
    *   FoodName2 (50g) [Properties]   ← WRONG - Don't use nested bullets

**CORRECT FORMAT (USE THIS):**
**Monday:**
- **Breakfast:** FoodName1 (100g) [Properties], FoodName2 (50g) [Properties], FoodName3 (150ml) [Properties]  ← CORRECT - All foods on one line

After the meal plan, provide:
- Brief explanation of dietary approach (2-3 sentences)
- Ayurvedic Supplement Recommendations (if any nutrients are below 90% target)

Generate the complete 7-day chart now:`;
}

// Helper function to parse Gemini AI diet response
function parseAIDietResponse(aiResponse, foods, nutritionGoals) {
  console.log("\n=== PARSING AI RESPONSE ===");

  // Extract calculated nutrition goals from AI response if present
  let calculatedGoals = nutritionGoals; // Default to provided goals
  const goalsSection = aiResponse.match(
    /CALCULATED NUTRITION GOALS:([\s\S]*?)(?:\*\*Monday|\*\*Explanation|$)/i
  );

  if (goalsSection) {
    console.log("Found AI-calculated nutrition goals");
    const goalsText = goalsSection[1];

    const extractValue = (pattern) => {
      const match = goalsText.match(pattern);
      return match ? parseFloat(match[1]) : 0;
    };

    calculatedGoals = {
      macronutrients: {
        calories: extractValue(/Calories:\s*(\d+)/i),
        protein: extractValue(/Protein:\s*(\d+)/i),
        carbs: extractValue(/Carbohydrates:\s*(\d+)/i),
        fat: extractValue(/Fat:\s*(\d+)/i),
        fiber: extractValue(/Fiber:\s*(\d+)/i),
      },
      vitamins: {
        vitamin_a: extractValue(/Vitamin A:\s*([\d.]+)/i),
        vitamin_b1: extractValue(/Vitamin B1:\s*([\d.]+)/i),
        vitamin_b2: extractValue(/Vitamin B2:\s*([\d.]+)/i),
        vitamin_b3: extractValue(/Vitamin B3:\s*([\d.]+)/i),
        vitamin_b6: extractValue(/Vitamin B6:\s*([\d.]+)/i),
        vitamin_b12: extractValue(/Vitamin B12:\s*([\d.]+)/i),
        vitamin_c: extractValue(/Vitamin C:\s*([\d.]+)/i),
        vitamin_d: extractValue(/Vitamin D:\s*([\d.]+)/i),
        vitamin_e: extractValue(/Vitamin E:\s*([\d.]+)/i),
        vitamin_k: extractValue(/Vitamin K:\s*([\d.]+)/i),
        folate: extractValue(/Folate:\s*([\d.]+)/i),
      },
      minerals: {
        calcium: extractValue(/Calcium:\s*([\d.]+)/i),
        iron: extractValue(/Iron:\s*([\d.]+)/i),
        magnesium: extractValue(/Magnesium:\s*([\d.]+)/i),
        phosphorus: extractValue(/Phosphorus:\s*([\d.]+)/i),
        potassium: extractValue(/Potassium:\s*([\d.]+)/i),
        sodium: extractValue(/Sodium:\s*([\d.]+)/i),
        zinc: extractValue(/Zinc:\s*([\d.]+)/i),
      },
    };

    console.log("Extracted calculated goals:", calculatedGoals);
  }

  const foodLookup = {};
  for (const food of foods) {
    const nameLower = food.name.toLowerCase().trim();
    foodLookup[nameLower] = food;

    // Also create variations for matching (remove special chars, extra spaces)
    const cleanName = nameLower
      .replace(/[(),-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (cleanName !== nameLower) {
      foodLookup[cleanName] = food;
    }
  }

  const weeklyPlan = {
    Mon: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Tue: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Wed: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Thu: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Fri: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Sat: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
    Sun: { Breakfast: [], Lunch: [], Snacks: [], Dinner: [] },
  };

  const lines = aiResponse.split("\n");
  let currentDay = null;
  let currentMeal = null;
  let explanationText = "";
  let considerationsList = [];
  let capturingExplanation = false;

  const dayMapping = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase().trim();

    // Detect day
    for (const [dayKey, dayAbbr] of Object.entries(dayMapping)) {
      if (
        lineLower.includes(dayKey) &&
        (line.includes("**") || line.includes("#"))
      ) {
        currentDay = dayAbbr;
        currentMeal = null;
        console.log(`Found day: ${dayAbbr}`);
        break;
      }
    }

    // Detect meal
    if (currentDay) {
      if (
        lineLower.includes("breakfast") &&
        (line.includes("**") || line.includes("-"))
      ) {
        currentMeal = "Breakfast";
        console.log(`  Found meal: Breakfast`);
      } else if (
        lineLower.includes("lunch") &&
        (line.includes("**") || line.includes("-"))
      ) {
        currentMeal = "Lunch";
        console.log(`  Found meal: Lunch`);
      } else if (
        lineLower.includes("snack") &&
        (line.includes("**") || line.includes("-"))
      ) {
        currentMeal = "Snacks";
        console.log(`  Found meal: Snacks`);
      } else if (
        lineLower.includes("dinner") &&
        (line.includes("**") || line.includes("-"))
      ) {
        currentMeal = "Dinner";
        console.log(`  Found meal: Dinner`);
      }

      // Extract foods - improved regex to match various formats including Ayurvedic properties and liquids
      if (currentMeal && line.includes(":")) {
        // Track already added foods in this meal to prevent duplicates
        const addedFoodIds = new Set();

        // Match patterns (support both g and ml):
        // 1. FoodName (XXXg/ml) [Rasa: X|Virya: X|Dosha: X]
        // 2. FoodName (XXXg/ml) - fallback without properties

        // Primary pattern with Ayurvedic properties (g or ml)
        const ayurvedicMatches = [
          ...line.matchAll(
            /([A-Za-z\s\(\)]+?)\s*\((\d+)\s*(g|ml)\)\s*\[Rasa:\s*([^\|]+)\|Virya:\s*([^\|]+)\|Dosha:\s*([^\]]+)\]/gi
          ),
          ...line.matchAll(
            /([A-Za-z\s\(\)]+?)\s*\((\d+)(g|ml)\)\s*\[Rasa:\s*([^\|]+)\|Virya:\s*([^\|]+)\|Dosha:\s*([^\]]+)\]/gi
          ),
        ];

        // Fallback pattern without properties (g or ml)
        const basicMatches = [
          ...line.matchAll(/([A-Za-z\s\(\)]+?)\s*\((\d+)\s*(g|ml)\)/gi),
          ...line.matchAll(/([A-Za-z\s\(\)]+?)\s*-\s*(\d+)\s*(g|ml)/gi),
          ...line.matchAll(/([A-Za-z\s\(\)]+?)\s*:\s*(\d+)\s*(g|ml)/gi),
        ];

        const foodMatches =
          ayurvedicMatches.length > 0 ? ayurvedicMatches : basicMatches;
        const hasAyurvedicProps = ayurvedicMatches.length > 0;

        for (const match of foodMatches) {
          let foodName = match[1].trim();
          const amount = parseInt(match[2]);
          const unit = hasAyurvedicProps ? match[3] : match[3]; // g or ml

          // Extract Ayurvedic properties from AI response (if available)
          let aiRasa = hasAyurvedicProps && match[4] ? match[4].trim() : null;
          let aiVirya = hasAyurvedicProps && match[5] ? match[5].trim() : null;
          let aiDoshaEffect =
            hasAyurvedicProps && match[6] ? match[6].trim() : null;

          // Clean food name (preserve case for exact matching)
          foodName = foodName.replace(/^[-•*]\s*/, "").trim();

          // Try exact match only (case-insensitive)
          const foodNameLower = foodName.toLowerCase();
          let foodData = foodLookup[foodNameLower];

          // If not found, try with cleaned name (remove special chars)
          if (!foodData) {
            const cleanName = foodNameLower
              .replace(/[(),-]/g, " ")
              .replace(/\s+/g, " ")
              .trim();
            foodData = foodLookup[cleanName];
          }

          // No partial matching - only exact matches accepted

          if (foodData && amount > 0) {
            // Check if this food was already added to prevent duplicates
            const foodId = foodData._id || foodData.id;
            if (addedFoodIds.has(foodId?.toString())) {
              console.log(
                `  Skipping duplicate: ${foodData.name} in ${currentDay} ${currentMeal}`
              );
              continue;
            }
            addedFoodIds.add(foodId?.toString());

            const servingRatio = amount / 100;

            // Parse AI dosha effect format: "balances vata", "increases pitta", etc.
            let parsedDoshaEffects = {};
            if (aiDoshaEffect) {
              const doshaLower = aiDoshaEffect.toLowerCase();
              if (doshaLower.includes("vata")) {
                parsedDoshaEffects.vata = doshaLower.includes("increases")
                  ? "increases"
                  : "balances";
              } else if (doshaLower.includes("pitta")) {
                parsedDoshaEffects.pitta = doshaLower.includes("increases")
                  ? "increases"
                  : "balances";
              } else if (doshaLower.includes("kapha")) {
                parsedDoshaEffects.kapha = doshaLower.includes("increases")
                  ? "increases"
                  : "balances";
              }
            }

            // Calculate nutrition with vitamins and minerals
            const foodItem = {
              _id: foodData._id || foodData.id,
              food_id: foodData._id || foodData.id,
              name: foodData.name,
              category: foodData.category,
              amount: amount,
              serving_unit: unit || "g", // Use extracted unit (g or ml)
              nutrition: {
                calories: Math.round(
                  (foodData.macronutrients?.calories_kcal || 0) * servingRatio
                ),
                protein:
                  Math.round(
                    (foodData.macronutrients?.proteins_g || 0) *
                      servingRatio *
                      10
                  ) / 10,
                carbs:
                  Math.round(
                    (foodData.macronutrients?.carbohydrates_g || 0) *
                      servingRatio *
                      10
                  ) / 10,
                fat:
                  Math.round(
                    (foodData.macronutrients?.fats_g || 0) * servingRatio * 10
                  ) / 10,
                fiber:
                  Math.round(
                    (foodData.macronutrients?.fiber_g || 0) * servingRatio * 10
                  ) / 10,
              },
              vitamins: {},
              minerals: {},
              // Use AI properties if available, otherwise fallback to database
              rasa: aiRasa ? [aiRasa] : foodData.rasa || [],
              virya: aiVirya || foodData.virya || "",
              vipaka: foodData.vipaka || "",
              dosha_effects:
                Object.keys(parsedDoshaEffects).length > 0
                  ? parsedDoshaEffects
                  : foodData.dosha_effects || {},
            };

            // Calculate vitamins
            if (foodData.vitamins) {
              for (const [key, value] of Object.entries(foodData.vitamins)) {
                if (value && typeof value === "number") {
                  foodItem.vitamins[key] =
                    Math.round(value * servingRatio * 100) / 100;
                }
              }
            }

            // Calculate minerals
            if (foodData.minerals) {
              for (const [key, value] of Object.entries(foodData.minerals)) {
                if (value && typeof value === "number") {
                  foodItem.minerals[key] =
                    Math.round(value * servingRatio * 100) / 100;
                }
              }
            }

            weeklyPlan[currentDay][currentMeal].push(foodItem);
            console.log(
              `    Added: ${foodData.name} (${amount}${unit})${
                aiRasa
                  ? ` [Rasa: ${aiRasa}|Virya: ${aiVirya}|Dosha: ${aiDoshaEffect}]`
                  : ""
              }`
            );
          } else {
            console.log(
              `    ⚠️  Not found: "${foodName}" (${amount}${unit || "g"})`
            );
          }
        }
      }
    }

    // Capture explanation and supplement recommendations
    if (
      lineLower.includes("explanation") ||
      lineLower.includes("dietary approach")
    ) {
      capturingExplanation = true;
    }
    if (
      capturingExplanation &&
      line.trim() &&
      !line.includes("**") &&
      !line.includes("#")
    ) {
      if (
        lineLower.includes("supplement") ||
        lineLower.includes("consideration") ||
        lineLower.includes("key point")
      ) {
        capturingExplanation = false;
      } else {
        explanationText += line.trim() + " ";
      }
    }

    // Capture supplement recommendations
    if (
      (lineLower.includes("supplement") || lineLower.includes("ayurvedic")) &&
      (lineLower.includes("recommendation") || lineLower.includes("suggest"))
    ) {
      const nextLines = lines.slice(i + 1, i + 10);
      for (const nextLine of nextLines) {
        const trimmed = nextLine.trim().replace(/^[-•*]\s*/, "");
        if (
          trimmed &&
          !trimmed.includes("**") &&
          !trimmed.includes("#") &&
          trimmed.includes("-")
        ) {
          // Parse supplement format: "Name - Dosage - Frequency - Reason"
          const parts = trimmed.split("-").map((p) => p.trim());
          if (parts.length >= 3) {
            considerationsList.push(trimmed);
          }
        }
      }
    }

    // Also capture regular considerations if no supplements
    if (
      (lineLower.includes("consideration") ||
        lineLower.includes("key point")) &&
      line.trim() &&
      !lineLower.includes("supplement")
    ) {
      const nextLines = lines.slice(i + 1, i + 5);
      for (const nextLine of nextLines) {
        const trimmed = nextLine.trim().replace(/^[-•*]\s*/, "");
        if (
          trimmed &&
          !trimmed.includes("**") &&
          !trimmed.includes("#") &&
          !considerationsList.some((c) => c.includes(trimmed))
        ) {
          considerationsList.push(trimmed);
        }
      }
    }
  }

  // Log summary
  console.log("\n=== PARSING SUMMARY ===");
  for (const [day, meals] of Object.entries(weeklyPlan)) {
    const totalFoods = Object.values(meals).reduce(
      (sum, meal) => sum + meal.length,
      0
    );
    console.log(`${day}: ${totalFoods} foods total`);
  }

  return {
    nutritionGoals: calculatedGoals, // Return AI-calculated goals or provided goals
    weeklyMealPlan: weeklyPlan,
    explanation:
      explanationText.trim() ||
      "This personalized Ayurvedic diet chart balances your dosha and supports your health goals.",
    considerations:
      considerationsList.length > 0
        ? considerationsList
        : [
            "Eat at regular times",
            "Stay well hydrated",
            "Adjust portions based on hunger and activity",
          ],
  };
}

// API to link diet chart to prescription
const linkDietChartToPrescription = async (req, res) => {
  try {
    const { chartId, prescriptionId } = req.body;
    const doctorId = req.body.docId; // From auth middleware

    const dietChart = await dietChartModel.findById(chartId);

    if (!dietChart) {
      return res.json({
        success: false,
        message: "Diet chart not found",
      });
    }

    // Verify doctor owns this chart
    if (dietChart.doctor_id.toString() !== doctorId) {
      return res.json({
        success: false,
        message: "Unauthorized",
      });
    }

    dietChart.prescription_id = prescriptionId;
    await dietChart.save();

    res.json({
      success: true,
      message: "Diet chart linked to prescription successfully",
      dietChart,
    });
  } catch (error) {
    console.log("Error linking diet chart:", error);
    res.json({ success: false, message: error.message });
  }
};

// Generate PDF for diet chart
const generateDietChartPDF = async (req, res) => {
  try {
    const { chartId } = req.params;
    const doctorId = req.body.docId;

    console.log('PDF Generation Debug:');
    console.log('Chart ID:', chartId);
    console.log('Doctor ID:', doctorId);

    // Fetch the diet chart (no need to populate food_ref since foods are embedded)
    const dietChart = await dietChartModel
      .findById(chartId)
      .populate("patient_id");

    console.log('Fetched diet chart:', !!dietChart);
    console.log('Weekly meal plan exists:', !!dietChart?.weekly_meal_plan);
    console.log('Weekly meal plan keys:', dietChart?.weekly_meal_plan ? Object.keys(dietChart.weekly_meal_plan) : 'None');

    if (!dietChart) {
      return res.json({ success: false, message: "Diet chart not found" });
    }

    // Verify doctor has access
    if (dietChart.doctor_id.toString() !== doctorId) {
      console.log('Doctor access denied:', dietChart.doctor_id.toString(), 'vs', doctorId);
      return res.json({ success: false, message: "Unauthorized access" });
    }

    // Fetch doctor data
    const doctorData = await doctorModel.findById(doctorId);
    console.log('Doctor data fetched:', !!doctorData);

    // Prepare data for PDF generation
    const dietChartData = {
      weeklyMealPlan: dietChart.weekly_meal_plan.toObject ? dietChart.weekly_meal_plan.toObject() : dietChart.weekly_meal_plan,
      nutritionGoals: dietChart.custom_nutrition_goals,
    };

    console.log('Diet chart data prepared:');
    console.log('Weekly meal plan keys:', dietChartData.weeklyMealPlan ? Object.keys(dietChartData.weeklyMealPlan) : 'None');
    console.log('Nutrition goals:', !!dietChartData.nutritionGoals);

    // Get patient data from both patient_id reference and patient_snapshot
    const patientSnapshot = dietChart.patient_snapshot || {};
    const patientData = {
      _id: dietChart.patient_id._id,
      name: dietChart.patient_id.name,
      age: patientSnapshot.age || dietChart.patient_id.age,
      gender: dietChart.patient_id.gender,
      constitution:
        patientSnapshot.constitution || dietChart.patient_id.constitution,
      bmi: dietChart.patient_id.bmi,
      primaryHealthCondition: patientSnapshot.primary_health_condition || "",
      currentSymptoms: patientSnapshot.current_symptoms || "",
      foodAllergies: patientSnapshot.food_allergies || "",
      healthGoals: patientSnapshot.health_goals || [],
    };

    // Generate PDF
    const { generateDietChartPDF: generatePDF } = await import(
      "../utils/pdfGenerator.js"
    );
    const { buffer, filename } = await generatePDF(
      dietChartData,
      patientData,
      doctorData
    );

    // Send PDF buffer directly to response (Vercel compatible)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error("Error generating diet chart PDF:", error);
    res.json({ success: false, message: error.message });
  }
};

// API to get patient AI summary
const getPatientAISummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctorId;
    const { forceRefresh } = req.query; // Optional query param to force regeneration
    
    console.log(`AI summary request for patient: ${patientId}`);
    
    // Verify doctor has access to this patient
    const patient = await userModel.findById(patientId);
    if (!patient) {
      return res.json({ success: false, message: 'Patient not found' });
    }
    
    // Check if doctor has access (either assigned doctor or has appointments)
    const hasAccess = patient.doctor.toString() === doctorId.toString();
    const hasAppointment = await appointmentModel.exists({ docId: doctorId, userId: patientId });
    
    if (!hasAccess && !hasAppointment) {
      return res.json({ success: false, message: 'Unauthorized access to patient' });
    }
    
    // Check if force refresh requested
    if (forceRefresh === 'true') {
      console.log('Force refresh requested - generating new summary');
      clearAISummaryCache(patientId);
      const summary = await generatePatientAISummary(patientId);
      return res.json({ 
        success: true, 
        summary,
        cached: false,
        regenerated: true
      });
    }
    
    // Check cache first
    const cachedSummary = getCachedAISummary(patientId, patient.aiSummary?.version);
    if (cachedSummary) {
      console.log('Serving AI summary from cache');
      return res.json({
        success: true,
        summary: {
          content: cachedSummary,
          metadata: patient.aiSummary.metadata,
          lastGenerated: patient.aiSummary.lastGenerated,
          version: patient.aiSummary.version
        },
        cached: true
      });
    }
    
    // Check if we have a stored summary in DB
    // Fetch current prescription count for comparison
    const currentPrescriptionCount = await prescriptionModel.countDocuments({ patientId: patientId });
    
    if (patient.aiSummary && patient.aiSummary.content && 
        patient.aiSummary.prescriptionCount === currentPrescriptionCount) {
      console.log('Serving AI summary from database (up to date)');
      
      // Cache it for future requests
      setCachedAISummary(patientId, patient.aiSummary.content, patient.aiSummary.version);
      
      return res.json({
        success: true,
        summary: {
          content: patient.aiSummary.content,
          metadata: patient.aiSummary.metadata,
          lastGenerated: patient.aiSummary.lastGenerated,
          version: patient.aiSummary.version
        },
        cached: false,
        fromDatabase: true
      });
    }
    
    // Generate new summary
    console.log('Generating new AI summary (prescription count changed or no summary exists)');
    const summary = await generatePatientAISummary(patientId);
    
    res.json({
      success: true,
      summary,
      cached: false,
      generated: true
    });
    
  } catch (error) {
    console.error('Error getting patient AI summary:', error);
    res.json({ success: false, message: error.message });
  }
};

// API to check AI service status
const checkAIServiceStatus = async (req, res) => {
  try {
    // Import the vector service check
    const { checkEmbeddingStatus } = await import('../services/fastVectorService.js');
    const status = await checkEmbeddingStatus();
    
    // Check if Gemini API is configured
    const hasGeminiKey = !!process.env.GEMINI_API_KEY;
    
    res.json({
      success: true,
      isReady: status.isReady && hasGeminiKey,
      vectorCount: status.totalVectors || 0,
      engine: status.engine || 'FastVector',
      geminiConfigured: hasGeminiKey,
      cacheVersion: '3.0',
      message: status.isReady && hasGeminiKey ? 'AI Diet Chart Service Ready' : 'AI Service Initializing...'
    });
  } catch (error) {
    console.error('Error checking AI service status:', error);
    res.json({
      success: false,
      isReady: false,
      message: 'AI Service Status Check Failed',
      error: error.message
    });
  }
};

// API to manually regenerate patient AI summary
const regeneratePatientAISummary = async (req, res) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.doctorId;
    
    console.log(`Manual regeneration request for patient: ${patientId}`);
    
    // Verify doctor has access
    const patient = await userModel.findById(patientId);
    if (!patient) {
      return res.json({ success: false, message: 'Patient not found' });
    }
    
    const hasAccess = patient.doctor.toString() === doctorId.toString();
    const hasAppointment = await appointmentModel.exists({ docId: doctorId, userId: patientId });
    
    if (!hasAccess && !hasAppointment) {
      return res.json({ success: false, message: 'Unauthorized access to patient' });
    }
    
    // Clear cache and regenerate
    clearAISummaryCache(patientId);
    const summary = await generatePatientAISummary(patientId);
    
    res.json({
      success: true,
      message: 'AI summary regenerated successfully',
      summary
    });
    
  } catch (error) {
    console.error('Error regenerating patient AI summary:', error);
    res.json({ success: false, message: error.message });
  }
};

// Add new food item to database with vector embedding
const addFoodItem = async (req, res) => {
  try {
    const {
      name,
      name_hindi,
      category,
      diet_type,
      macronutrients,
      ayurvedic_properties,
      vitamins,
      minerals,
      serving_size,
      seasonal_availability,
      health_benefits,
      preparation_methods,
      storage_instructions,
      common_combinations
    } = req.body;

    // Validate required fields
    if (!name || !category || !macronutrients) {
      return res.json({
        success: false,
        message: "Name, category, and macronutrients are required"
      });
    }

    // Check if food already exists
    const existingFood = await foodModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    
    if (existingFood) {
      return res.json({
        success: false,
        message: "A food item with this name already exists"
      });
    }

    // Generate unique food_id
    const lastFood = await foodModel.findOne({}, {}, { sort: { food_id: -1 } });
    const nextFoodId = lastFood ? lastFood.food_id + 1 : 10001;

    // Create food object
    const newFood = new foodModel({
      food_id: nextFoodId,
      name: name.trim(),
      name_hindi: name_hindi || '',
      category: category.toLowerCase(),
      diet_type: diet_type || 'vegetarian',
      macronutrients: {
        calories_kcal: macronutrients.calories_kcal || 0,
        proteins_g: macronutrients.proteins_g || 0,
        carbohydrates_g: macronutrients.carbohydrates_g || 0,
        fats_g: macronutrients.fats_g || 0,
        fiber_g: macronutrients.fiber_g || 0,
        sugar_g: macronutrients.sugar_g || 0,
        sodium_mg: macronutrients.sodium_mg || 0
      },
      ayurvedic_properties: {
        rasa: ayurvedic_properties?.rasa || ['sweet'],
        virya: ayurvedic_properties?.virya || 'neutral',
        vipaka: ayurvedic_properties?.vipaka || 'sweet',
        dosha_effects: {
          vata: ayurvedic_properties?.dosha_effects?.vata || 'neutral',
          pitta: ayurvedic_properties?.dosha_effects?.pitta || 'neutral',
          kapha: ayurvedic_properties?.dosha_effects?.kapha || 'neutral'
        },
        karma: {
          physical_actions: ayurvedic_properties?.karma?.physical_actions || [],
          mental_actions: ayurvedic_properties?.karma?.mental_actions || []
        }
      },
      vitamins: vitamins || {},
      minerals: minerals || {},
      serving_size: {
        amount: serving_size?.amount || 100,
        unit: serving_size?.unit || 'g'
      },
      seasonal_availability: seasonal_availability || [],
      health_benefits: health_benefits || [],
      preparation_methods: preparation_methods || [],
      storage_instructions: storage_instructions || '',
      common_combinations: common_combinations || [],
      created_by_doctor: req.doctorId,
      created_at: new Date(),
      is_custom: true
    });

    // Save to database
    const savedFood = await newFood.save();

    // Update vector embeddings asynchronously (OPTIMIZED: incremental update)
    let vectorUpdateSuccess = false;
    let vectorMessage = "";
    
    try {
      const { addFoodToIndex } = await import('../services/fastVectorService.js');
      const result = await addFoodToIndex(savedFood);
      vectorUpdateSuccess = result.success;
      vectorMessage = result.success 
        ? " and vector index updated (incremental)" 
        : " (vector index update failed)";
      console.log(`✅ Vector index incrementally updated for new food: ${name}`);
    } catch (vectorError) {
      console.error('Error updating vector index:', vectorError);
      vectorMessage = " (vector index update failed - will be included in next full rebuild)";
      // Don't fail the request if vector update fails
    }

    // Clear food cache
    foodCache.data = null;
    foodCache.timestamp = null;

    res.json({
      success: true,
      message: `Food item added successfully${vectorMessage}`,
      food: savedFood,
      foodId: savedFood._id,
      vectorUpdateSuccess
    });

  } catch (error) {
    console.error("Error adding food item:", error);
    res.json({
      success: false,
      message: error.message || "Failed to add food item"
    });
  }
};

// Update existing food item
const updateFoodItem = async (req, res) => {
  try {
    const { foodId } = req.params;
    const updateData = req.body;

    // Find and update food
    const updatedFood = await foodModel.findByIdAndUpdate(
      foodId,
      {
        ...updateData,
        updated_at: new Date(),
        updated_by_doctor: req.doctorId
      },
      { new: true }
    );

    if (!updatedFood) {
      return res.json({
        success: false,
        message: "Food item not found"
      });
    }

    // Update vector embeddings asynchronously (OPTIMIZED: incremental update)
    try {
      const { addFoodToIndex } = await import('../services/fastVectorService.js');
      await addFoodToIndex(updatedFood);
      console.log(`✅ Vector index incrementally updated for food: ${updatedFood.name}`);
    } catch (vectorError) {
      console.error('Error updating vector index:', vectorError);
    }

    // Clear food cache
    foodCache.data = null;
    foodCache.timestamp = null;

    res.json({
      success: true,
      message: "Food item updated successfully and vector index updated (incremental)",
      food: updatedFood
    });

  } catch (error) {
    console.error("Error updating food item:", error);
    res.json({
      success: false,
      message: error.message || "Failed to update food item"
    });
  }
};

// Delete food item
const deleteFoodItem = async (req, res) => {
  try {
    const { foodId } = req.params;

    // Find and delete food
    const deletedFood = await foodModel.findByIdAndDelete(foodId);

    if (!deletedFood) {
      return res.json({
        success: false,
        message: "Food item not found"
      });
    }

    // Update vector embeddings asynchronously (OPTIMIZED: incremental removal)
    try {
      const { removeFoodFromIndex } = await import('../services/fastVectorService.js');
      await removeFoodFromIndex(foodId);
      console.log(`✅ Vector index updated after deleting: ${deletedFood.name}`);
    } catch (vectorError) {
      console.error('Error updating vector index:', vectorError);
    }

    // Clear food cache
    foodCache.data = null;
    foodCache.timestamp = null;

    res.json({
      success: true,
      message: "Food item deleted successfully and vector index updated (incremental)"
    });

  } catch (error) {
    console.error("Error deleting food item:", error);
    res.json({
      success: false,
      message: error.message || "Failed to delete food item"
    });
  }
};

export {
  signupDoctor,
  loginDoctor,
  appointmentsDoctor,
  appointmentCancel,
  undoCancellation,
  confirmAppointment,
  startAppointment,
  appointmentComplete,
  markReminderSent,
  createAppointmentByDoctor,
  updateAppointmentByDoctor,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getPatients,
  addPatientByDoctor,
  updatePatientByDoctor,
  emailPrescription,
  getFoodDatabase,
  addFoodItem,
  updateFoodItem,
  deleteFoodItem,
  clearFoodCache,
  createDietChart,
  getDietChartsByPatient,
  getDietChartsByDoctor,
  getDietChartById,
  updateDietChart,
  deleteDietChart,
  generateAIDietChart,
  linkDietChartToPrescription,
  generateDietChartPDF,
  getPatientAISummary,
  regeneratePatientAISummary,
  generatePatientAISummary,
  checkAIServiceStatus,
  changeAvailablity,
  doctorList
};

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import prescriptionModel from "../models/prescriptionModel.js";
import foodModel from "../models/foodModel.js";
import dietChartModel from "../models/dietChartModel.js";
import transporter from "../config/nodemailer.js";
import { generatePrescriptionPDF } from "../utils/pdfGenerator.js";
import { getPrescriptionEmailTemplate } from "../utils/emailTemplate.js";
import fs from 'fs';

// In-memory cache for food database
let foodCache = {
    data: null,
    timestamp: null,
    version: '1.0.0', // Increment this when food DB is updated
    ttl: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds (monthly cache)
};

// API for doctor Login 
const loginDoctor = async (req, res) => {

    try {

        const { email, password } = req.body
        const user = await doctorModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor appointments for doctor panel
const appointmentsDoctor = async (req, res) => {
  try {
    const docId = req.doctorId;

    const appointments = await appointmentModel
      .find({ docId })
      .populate('userId', 'name email phone address gender dob image notes')
      .sort({ slotDate: -1, slotTime: -1 });

    // Format appointments to rename userId to userData for frontend compatibility
    const formattedAppointments = appointments.map(apt => ({
      ...apt.toObject(),
      userData: apt.userId,
      userId: apt.userId._id
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

        const { appointmentId, reason } = req.body
        const docId = req.doctorId;

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        if (appointmentData.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to cancel this appointment' })
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancelled: true,
            status: 'cancelled',
            cancellationReason: reason || 'Cancelled by doctor',
            cancelledBy: 'doctor',
            cancelledAt: new Date()
        })
        
        return res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to undo appointment cancellation
const undoCancellation = async (req, res) => {
    try {
        const { appointmentId } = req.params
        const docId = req.doctorId;

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        if (appointmentData.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to restore this appointment' })
        }

        if (!appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment is not cancelled' })
        }
        
        // Determine the status to restore to based on payment
        const restoredStatus = appointmentData.payment ? 'confirmed' : 'scheduled'
        
        // Update appointment and remove cancellation fields
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancelled: false,
            status: restoredStatus,
            $unset: {
                cancellationReason: "",
                cancelledBy: "",
                cancelledAt: ""
            }
        }, { new: true })
        
        console.log(`Appointment ${appointmentId} restored to status: ${restoredStatus}`)
        
        return res.json({ success: true, message: 'Appointment restored successfully' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to confirm appointment (scheduled -> confirmed)
const confirmAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const docId = req.doctorId;

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        if (appointmentData.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to confirm this appointment' })
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: 'confirmed',
            payment: true
        })
        
        return res.json({ success: true, message: 'Appointment Confirmed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to start appointment (confirmed -> in-progress)
const startAppointment = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const docId = req.doctorId;

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        if (appointmentData.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to start this appointment' })
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            status: 'in-progress',
            startedAt: new Date()
        })
        
        return res.json({ success: true, message: 'Appointment Started' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const docId = req.doctorId;

        const appointmentData = await appointmentModel.findById(appointmentId)
        
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        if (appointmentData.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to complete this appointment' })
        }
        
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            isCompleted: true,
            status: 'completed',
            completedAt: new Date()
        })
        
        return res.json({ success: true, message: 'Appointment Completed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to create appointment by doctor
const createAppointmentByDoctor = async (req, res) => {
    try {
        console.log('=== CREATE APPOINTMENT REQUEST ===');
        console.log('Request body:', req.body);
        console.log('Doctor ID:', req.doctorId);
        
        const { userId, slotDate, slotTime, appointmentType, locationType, duration, amount, paymentMethod } = req.body
        const docId = req.doctorId

        // Validate required fields
        if (!userId || !slotDate || !slotTime) {
            console.log('Missing required fields:', { userId, slotDate, slotTime });
            return res.json({ success: false, message: 'Missing required fields' })
        }

        // Check if patient exists
        const patient = await userModel.findById(userId)
        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' })
        }

        // Check if doctor exists
        const doctor = await doctorModel.findById(docId)
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' })
        }

        // Check if slot is already booked
        const existingAppointment = await appointmentModel.findOne({
            docId,
            slotDate,
            slotTime,
            cancelled: false
        })

        if (existingAppointment) {
            return res.json({ success: false, message: 'This time slot is already booked' })
        }

        // Create appointment
        const appointmentData = {
            userId,
            docId,
            slotDate,
            slotTime,
            date: Date.now(),
            duration: duration || 45,
            status: 'scheduled',
            appointmentType: appointmentType || 'consultation',
            locationType: locationType || 'clinic',
            amount: amount || doctor.fees,
            paymentMethod: paymentMethod || 'cash'
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()
        
        console.log('Appointment created:', newAppointment._id);

        // Update doctor's slotsBooked array
        await doctorModel.findByIdAndUpdate(docId, {
            $push: { slotsBooked: newAppointment._id }
        })
        
        console.log('Updated doctor slotsBooked');

        res.json({ success: true, message: 'Appointment created successfully', appointmentId: newAppointment._id })

    } catch (error) {
        console.log('Error creating appointment:', error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for Frontend
const doctorList = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to change doctor availablity for Admin and Doctor Panel
const changeAvailablity = async (req, res) => {
    try {

        const docId = req.doctorId;

        const docData = await doctorModel.findById(docId)
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available })
        res.json({ success: true, message: 'Availablity Changed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get doctor profile for  Doctor Panel
const doctorProfile = async (req, res) => {
    try {

        const docId = req.doctorId;
        const profileData = await doctorModel.findById(docId).select('-password')

        res.json({ success: true, profileData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update doctor profile data from  Doctor Panel
const updateDoctorProfile = async (req, res) => {
    try {

        const { fees, address, available, about, degree, experience, phone } = req.body
        const docId = req.doctorId;

        const updateData = {};
        if (fees !== undefined) updateData.fees = fees;
        if (address !== undefined) updateData.address = address;
        if (available !== undefined) updateData.available = available;
        if (about !== undefined) updateData.about = about;
        if (degree !== undefined) updateData.degree = degree;
        if (experience !== undefined) updateData.experience = experience;
        if (phone !== undefined) updateData.phone = phone;

        await doctorModel.findByIdAndUpdate(docId, updateData)

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
    try {

        const docId = req.doctorId;

        const appointments = await appointmentModel
            .find({ docId })
            .populate('userId', 'name email')

        // Calculate earnings for current month only
        let earnings = 0
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()

        appointments.map((item) => {
            if (item.isCompleted || item.payment) {
                const appointmentDate = new Date(item.slotDate)
                // Check if appointment is in current month and year
                if (appointmentDate.getMonth() === currentMonth && 
                    appointmentDate.getFullYear() === currentYear) {
                    earnings += item.amount
                }
            }
        })

        let patients = []

        appointments.map((item) => {
            if (!patients.includes(item.userId._id.toString())) {
                patients.push(item.userId._id.toString())
            }
        })

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add a patient for a doctor
const addPatientByDoctor = async (req, res) => {
    try {
        console.log('=== ADD PATIENT REQUEST ===');
        console.log('req.body:', req.body);
        console.log('req.doctorId:', req.doctorId);
        console.log('req.headers:', req.headers);
        
        const { name, email, password, phone, address, gender, dob, constitution, condition, foodAllergies, notes } = req.body;
        const docId = req.doctorId; // Get from req instead of req.body
        const imageFile = req.file;

        // Validate required fields
        if (!name || !email) {
            return res.json({ success: false, message: "Name and email are required" });
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
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "User with this email already exists" });
        }

        // Hash password if provided, otherwise use a default
        let hashedPassword = '';
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
        let imageUrl = 'data:image/png;base64,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...';
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        // Parse address if provided as string
        let parsedAddress = address;
        if (address && typeof address === 'string') {
            try {
                parsedAddress = JSON.parse(address);
            } catch {
                parsedAddress = { line1: address, line2: '', city: '', state: '', pincode: '', country: '' };
            }
        }

        const patientData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            phone: phone || '000000000',
            address: parsedAddress || { line1: '', line2: '', city: '', state: '', pincode: '', country: '' },
            gender: gender || 'Not Selected',
            dob: dob ? new Date(dob) : new Date(),
            constitution: constitution || '',
            condition: condition || '',
            foodAllergies: foodAllergies || '',
            notes: notes || '',
            doctor: docId // Associate patient with the doctor who added them
        };

        console.log('Patient data being saved:', {
            ...patientData,
            password: '[HIDDEN]',
            image: '[HIDDEN]'
        });
        console.log('Doctor ID:', docId);

        const newPatient = new userModel(patientData);
        const savedPatient = await newPatient.save();

        console.log('Patient saved successfully with doctor:', savedPatient.doctor);

        res.json({ success: true, message: 'Patient added successfully', patient: { ...savedPatient.toObject(), password: undefined } });

    } catch (error) {
        console.log('Error in addPatientByDoctor:', error);
        
        // Check if it's a validation error
        if (error.name === 'ValidationError') {
            console.log('Validation errors:', error.errors);
            return res.json({ 
                success: false, 
                message: `Validation error: ${Object.keys(error.errors).map(key => error.errors[key].message).join(', ')}` 
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

        console.log('Update patient request - patientId:', patientId, 'docId:', docId);

        // Validate patientId
        if (!patientId || patientId === 'undefined') {
            console.error('Invalid patient ID received:', patientId);
            return res.json({ success: false, message: 'Invalid patient ID' });
        }

        // Verify doctor has access to this patient (either through appointment or direct assignment)
        const hasAppointment = await appointmentModel.exists({ docId, userId: patientId });
        const isAssignedDoctor = await userModel.exists({ _id: patientId, doctor: docId });
        
        console.log('Access check - hasAppointment:', hasAppointment, 'isAssignedDoctor:', isAssignedDoctor);
        
        if (!hasAppointment && !isAssignedDoctor) {
            console.log('Doctor does not have access to patient - no appointment and not assigned doctor');
            return res.json({ success: false, message: 'Unauthorized access to patient' });
        }

        console.log('Updates received:', updates);

        // Parse address if provided as string
        if (updates.address && typeof updates.address === 'string') {
            try {
                updates.address = JSON.parse(updates.address);
            } catch {
                // Keep as is if parsing fails
            }
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
            console.log('Patient not found with ID:', patientId);
            return res.json({ success: false, message: 'Patient not found' });
        }

        console.log('Patient updated successfully:', patient._id);
        res.json({ success: true, patient });
    } catch (error) {
        console.error('Error updating patient:', error);
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
            .select('-password')
            .sort({ createdAt: -1 });

        // Format the patient data for frontend
        const formattedPatients = patients.map(patient => {
            // Calculate age if DOB is provided
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

            return {
                _id: patient._id,
                id: patient._id.toString(),
                name: patient.name,
                email: patient.email,
                phone: patient.phone || 'Not provided',
                age: age,
                dob: patient.dob,
                gender: patient.gender || 'Not Selected',
                constitution: patient.constitution || 'Not assessed',
                condition: patient.condition || '',
                foodAllergies: patient.foodAllergies || '',
                notes: patient.notes || '',
                address: patient.address || {
                    line1: '',
                    line2: '',
                    city: '',
                    state: '',
                    pincode: '',
                    country: 'India'
                },
                addressDisplay: `${patient.address?.line1 || ''} ${patient.address?.line2 || ''}`.trim() || 'Not provided',
                registrationDate: patient.createdAt,
                status: 'Active',
                image: patient.image
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
            return res.json({ success: false, message: 'Prescription not found' });
        }

        // Get doctor info
        const doctor = await doctorModel.findById(doctorId);
        if (!doctor) {
            return res.json({ success: false, message: 'Doctor not found' });
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
            return res.json({ success: false, message: 'Patient email not found' });
        }

        // Generate PDF
        console.log('Generating PDF for prescription:', prescriptionId);
        const { filepath, filename } = await generatePrescriptionPDF(prescription, {
            name: doctor.name,
            speciality: doctor.speciality,
            email: doctor.email
        });

        // Generate email HTML
        const emailHTML = getPrescriptionEmailTemplate(prescription, {
            name: doctor.name,
            speciality: doctor.speciality,
            email: doctor.email
        });

        // Determine from address based on email service
        let fromAddress;
        if (process.env.EMAIL_SERVICE === 'ethereal' || !process.env.EMAIL_USER) {
            // For Ethereal, use a default sender (Ethereal will override with test account)
            fromAddress = `"${doctor.name} - Ayurvedic Health Center" <noreply@ayurveda.com>`;
        } else {
            fromAddress = `"${doctor.name} - Ayurvedic Health Center" <${process.env.EMAIL_USER}>`;
        }

        // Send email
        const mailOptions = {
            from: fromAddress,
            to: patientEmail,
            subject: `Your Ayurvedic Prescription - ${prescription.prescriptionId}`,
            html: emailHTML,
            attachments: [
                {
                    filename: `Prescription_${prescription.prescriptionId}.pdf`,
                    path: filepath
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully to:', patientEmail);

        // Update prescription with emailedAt timestamp
        prescription.emailedAt = new Date();
        await prescription.save();

        // Delete the temporary PDF file
        fs.unlink(filepath, (err) => {
            if (err) console.error('Error deleting PDF file:', err);
        });

        res.json({ 
            success: true, 
            message: 'Prescription emailed successfully',
            emailedAt: prescription.emailedAt
        });

    } catch (error) {
        console.error('Error emailing prescription:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to update appointment by doctor
const updateAppointmentByDoctor = async (req, res) => {
    try {
        const { appointmentId } = req.params
        const { userId, slotDate, slotTime, appointmentType, locationType, duration, amount, paymentMethod, status } = req.body
        const docId = req.doctorId

        console.log('=== UPDATE APPOINTMENT REQUEST ===')
        console.log('Appointment ID:', appointmentId)
        console.log('Request body:', req.body)
        console.log('Doctor ID:', docId)

        // Validate required fields
        if (!slotDate || !slotTime) {
            return res.json({ success: false, message: 'Date and time are required' })
        }

        // Check if appointment exists and belongs to this doctor
        const appointment = await appointmentModel.findById(appointmentId)
        if (!appointment) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        
        console.log('Appointment docId:', appointment.docId, 'Type:', typeof appointment.docId)
        console.log('Request docId:', docId, 'Type:', typeof docId)
        console.log('Comparison result:', appointment.docId.toString() === docId.toString())
        
        if (appointment.docId.toString() !== docId.toString()) {
            return res.json({ success: false, message: 'Unauthorized to update this appointment' })
        }

        // Check if new slot is already booked (if slot time changed)
        if (appointment.slotDate !== slotDate || appointment.slotTime !== slotTime) {
            const existingAppointment = await appointmentModel.findOne({
                _id: { $ne: appointmentId }, // Exclude current appointment
                docId,
                slotDate,
                slotTime,
                cancelled: false
            })

            if (existingAppointment) {
                return res.json({ success: false, message: 'This time slot is already booked' })
            }
        }

        // Update appointment
        const updateData = {
            slotDate,
            slotTime,
            appointmentType: appointmentType || appointment.appointmentType,
            locationType: locationType || appointment.locationType,
            duration: duration || appointment.duration,
            paymentMethod: paymentMethod || appointment.paymentMethod
        }

        if (amount !== undefined) {
            updateData.amount = amount
        }

        // Update status if provided
        if (status) {
            updateData.status = status
            // Update related fields based on status
            if (status === 'confirmed') {
                updateData.payment = true
            } else if (status === 'completed') {
                updateData.isCompleted = true
                updateData.completedAt = new Date()
            } else if (status === 'cancelled') {
                updateData.cancelled = true
                updateData.cancelledBy = 'doctor'
                updateData.cancelledAt = new Date()
            }
        }

        const updatedAppointment = await appointmentModel.findByIdAndUpdate(
            appointmentId,
            updateData,
            { new: true }
        )

        console.log('Appointment updated successfully:', updatedAppointment._id)

        res.json({ 
            success: true, 
            message: 'Appointment updated successfully', 
            appointment: updatedAppointment 
        })

    } catch (error) {
        console.log('Error updating appointment:', error)
        res.json({ success: false, message: error.message })
    }
}

// API to get food database for diet chart with caching
const getFoodDatabase = async (req, res) => {
    try {
        const now = Date.now();
        
        // Check if cache is valid
        if (foodCache.data && foodCache.timestamp && (now - foodCache.timestamp < foodCache.ttl)) {
            console.log('Serving food data from cache (monthly cache)');
            return res.json({ 
                success: true, 
                foods: foodCache.data,
                cached: true,
                cacheVersion: foodCache.version,
                cacheAge: Math.floor((now - foodCache.timestamp) / 1000 / 60 / 60 / 24), // age in days
                cacheExpiry: new Date(foodCache.timestamp + foodCache.ttl).toISOString()
            });
        }
        
        // Cache miss or expired - fetch from database
        console.log('Cache miss - fetching food data from database');
        
        // Use aggregation to get only unique foods based on name and serving unit
        const foods = await foodModel.aggregate([
            {
                // Group by name and serving unit to get unique combinations
                $group: {
                    _id: {
                        name: "$name",
                        serving_unit: "$serving_size.unit"
                    },
                    // Keep the first document for each unique combination
                    doc: { $first: "$$ROOT" }
                }
            },
            {
                // Replace root with the original document
                $replaceRoot: { newRoot: "$doc" }
            },
            {
                // Sort by name for consistent ordering
                $sort: { name: 1 }
            }
        ]);
        
        // Update cache
        foodCache.data = foods;
        foodCache.timestamp = now;
        
        console.log(`Cached ${foods.length} unique food items (by name + serving unit) for 30 days`);
        
        res.json({ 
            success: true, 
            foods,
            cached: false,
            cacheVersion: foodCache.version,
            totalItems: foods.length
        });
    } catch (error) {
        console.log('Error fetching food database:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to clear food cache (useful for admin updates)
const clearFoodCache = () => {
    foodCache.data = null;
    foodCache.timestamp = null;
    console.log('Food cache cleared');
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
            dietaryRestrictions
        } = req.body;

        const doctorId = req.body.docId; // From auth middleware

        // Validate required fields
        if (!patientId || !patientDetails || !weeklyMealPlan) {
            return res.json({ 
                success: false, 
                message: 'Patient ID, patient details, and weekly meal plan are required' 
            });
        }

        // Transform weekly meal plan to store complete food details (not references)
        const transformedMealPlan = {};
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
        
        days.forEach(day => {
            transformedMealPlan[day] = {};
            meals.forEach(meal => {
                if (weeklyMealPlan[day] && weeklyMealPlan[day][meal]) {
                    transformedMealPlan[day][meal] = weeklyMealPlan[day][meal].map(food => ({
                        food_id: food._id || food.id, // Original food ID for reference
                        name: food.name,
                        category: food.category,
                        amount: food.amount,
                        serving_unit: food.serving_unit || food.serving_size?.unit || 'g',
                        calculated_nutrition: {
                            calories: food.nutrition?.calories || food.calculated_nutrition?.calories || 0,
                            protein: food.nutrition?.protein || food.calculated_nutrition?.protein || 0,
                            carbs: food.nutrition?.carbs || food.calculated_nutrition?.carbs || 0,
                            fat: food.nutrition?.fat || food.calculated_nutrition?.fat || 0,
                            fiber: food.nutrition?.fiber || food.calculated_nutrition?.fiber || 0
                        },
                        vitamins: {
                            vitamin_a: food.vitamins?.vitamin_a_mcg || food.vitamins?.vitamin_a || 0,
                            vitamin_b1: food.vitamins?.vitamin_b1_mg || food.vitamins?.vitamin_b1 || 0,
                            vitamin_b2: food.vitamins?.vitamin_b2_mg || food.vitamins?.vitamin_b2 || 0,
                            vitamin_b6: food.vitamins?.vitamin_b6_mg || food.vitamins?.vitamin_b6 || 0,
                            vitamin_b12: food.vitamins?.vitamin_b12_mcg || food.vitamins?.vitamin_b12 || 0,
                            vitamin_c: food.vitamins?.vitamin_c_mg || food.vitamins?.vitamin_c || 0,
                            vitamin_d: food.vitamins?.vitamin_d_mcg || food.vitamins?.vitamin_d || 0,
                            vitamin_e: food.vitamins?.vitamin_e_mg || food.vitamins?.vitamin_e || 0,
                            folate: food.vitamins?.folate_mcg || food.vitamins?.folate || 0
                        },
                        minerals: {
                            calcium: food.minerals?.calcium_mg || food.minerals?.calcium || 0,
                            iron: food.minerals?.iron_mg || food.minerals?.iron || 0,
                            magnesium: food.minerals?.magnesium_mg || food.minerals?.magnesium || 0,
                            phosphorus: food.minerals?.phosphorus_mg || food.minerals?.phosphorus || 0,
                            potassium: food.minerals?.potassium_mg || food.minerals?.potassium || 0,
                            sodium: food.minerals?.sodium_mg || food.minerals?.sodium || 0,
                            zinc: food.minerals?.zinc_mg || food.minerals?.zinc || 0
                        }
                    }));
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
                health_goals: patientDetails.healthGoals || []
            },
            custom_nutrition_goals: customNutritionGoals || {
                macronutrients: {
                    calories: 2000,
                    protein: 50,
                    carbs: 250,
                    fat: 65,
                    fiber: 25
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
                    folate: 400
                },
                minerals: {
                    calcium: 1000,
                    iron: 10,
                    magnesium: 310,
                    phosphorus: 700,
                    potassium: 2600,
                    sodium: 1500,
                    zinc: 8
                }
            },
            weekly_meal_plan: transformedMealPlan,
            special_instructions: specialInstructions,
            dietary_restrictions: dietaryRestrictions || [],
            status: 'active'
        });

        // Calculate nutrition summary
        dietChart.calculateNutritionSummary();

        // Save to database
        await dietChart.save();

        res.json({ 
            success: true, 
            message: 'Diet chart created successfully',
            dietChartId: dietChart._id,
            dietChart
        });

    } catch (error) {
        console.log('Error creating diet chart:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get diet charts for a specific patient
const getDietChartsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;

        const dietCharts = await dietChartModel.find({ patient_id: patientId })
            .sort({ created_at: -1 })
            .populate('doctor_id', 'name speciality')
            .populate('prescription_id');

        res.json({ 
            success: true, 
            count: dietCharts.length,
            dietCharts 
        });

    } catch (error) {
        console.log('Error fetching diet charts:', error);
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

        const dietCharts = await dietChartModel.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('patient_id', 'name email phone age gender');

        res.json({ 
            success: true, 
            count: dietCharts.length,
            dietCharts 
        });

    } catch (error) {
        console.log('Error fetching diet charts:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to get a specific diet chart by ID
const getDietChartById = async (req, res) => {
    try {
        const { chartId } = req.params;

        console.log('Fetching diet chart with ID:', chartId);

        let dietChart = await dietChartModel.findById(chartId)
            .populate('patient_id', 'name email phone age gender')
            .populate('doctor_id', 'name speciality email')
            .populate('prescription_id');

        if (!dietChart) {
            console.log('Diet chart not found');
            return res.json({ 
                success: false, 
                message: 'Diet chart not found' 
            });
        }

        console.log('Diet chart found');
        console.log('Meal plan structure:', JSON.stringify(dietChart.weekly_meal_plan.Mon.Breakfast, null, 2));

        // Convert to object and return - foods are already stored with complete details
        const chartObject = dietChart.toObject();
        
        // Log food counts for debugging
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
        
        days.forEach(day => {
            meals.forEach(meal => {
                if (chartObject.weekly_meal_plan[day] && chartObject.weekly_meal_plan[day][meal]) {
                    console.log(`${day} ${meal}: ${chartObject.weekly_meal_plan[day][meal].length} items`);
                }
            });
        });

        res.json({ 
            success: true, 
            dietChart: chartObject
        });

    } catch (error) {
        console.log('Error fetching diet chart:', error);
        console.error('Error stack:', error.stack);
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
                message: 'Diet chart not found' 
            });
        }

        // Verify doctor owns this chart
        if (dietChart.doctor_id.toString() !== doctorId) {
            return res.json({ 
                success: false, 
                message: 'Unauthorized to update this diet chart' 
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
            message: 'Diet chart updated successfully',
            dietChart 
        });

    } catch (error) {
        console.log('Error updating diet chart:', error);
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
                message: 'Diet chart not found' 
            });
        }

        // Verify doctor owns this chart
        if (dietChart.doctor_id.toString() !== doctorId) {
            return res.json({ 
                success: false, 
                message: 'Unauthorized to delete this diet chart' 
            });
        }

        if (hardDelete === 'true') {
            // Permanent deletion
            await dietChartModel.findByIdAndDelete(chartId);
            res.json({ 
                success: true, 
                message: 'Diet chart permanently deleted' 
            });
        } else {
            // Soft delete - mark as discontinued
            dietChart.status = 'discontinued';
            await dietChart.save();
            res.json({ 
                success: true, 
                message: 'Diet chart discontinued successfully' 
            });
        }

    } catch (error) {
        console.log('Error deleting diet chart:', error);
        res.json({ success: false, message: error.message });
    }
};

// API to generate AI diet chart using RAG model
const generateAIDietChart = async (req, res) => {
    try {
        const { 
            patientDetails,
            customNutritionGoals,
            ragModelUrl 
        } = req.body;

        console.log('AI Diet Chart Generation requested');
        console.log('Patient Details:', patientDetails);
        console.log('Custom Goals:', customNutritionGoals);

        // Validate required fields
        if (!patientDetails || !ragModelUrl) {
            return res.json({ 
                success: false, 
                message: 'Patient details and RAG model URL are required' 
            });
        }

        // Get all foods from database for AI context
        const allFoods = await foodModel.find({}).select('-__v').lean();
        
        console.log(`Retrieved ${allFoods.length} foods from database for AI context`);

        // Prepare comprehensive context for RAG model
        const contextPayload = {
            patient_info: {
                name: patientDetails.patientName,
                age: patientDetails.age,
                gender: patientDetails.gender,
                constitution: patientDetails.constitution,
                primary_health_condition: patientDetails.primaryHealthCondition,
                current_symptoms: patientDetails.currentSymptoms,
                food_allergies: patientDetails.foodAllergies,
                health_goals: patientDetails.healthGoals || []
            },
            custom_nutrition_goals: customNutritionGoals || null,
            available_foods: allFoods.map(food => ({
                id: food._id.toString(),
                name: food.name,
                category: food.category,
                macronutrients: food.macronutrients,
                vitamins: food.vitamins || {},
                minerals: food.minerals || {},
                rasa: food.rasa,
                virya: food.virya,
                vipaka: food.vipaka,
                dosha_effects: food.dosha_effects,
                health_benefits: food.health_benefits,
                diet_type: food.diet_type,
                seasonal_availability: food.seasonal_availability
            })),
            requirements: {
                generate_custom_goals: !customNutritionGoals,
                create_7_day_meal_plan: true,
                meals_per_day: ['Breakfast', 'Lunch', 'Snacks', 'Dinner'],
                consider_ayurvedic_principles: true,
                balance_doshas: true
            }
        };

        // Ensure the URL ends with /generate
        const generateUrl = ragModelUrl.endsWith('/generate') 
            ? ragModelUrl 
            : `${ragModelUrl}/generate`;
            
        console.log('Sending request to RAG model:', generateUrl);

        // Call RAG model API
        const ragResponse = await fetch(generateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contextPayload)
        });

        if (!ragResponse.ok) {
            throw new Error(`RAG model responded with status: ${ragResponse.status}`);
        }

        const aiResult = await ragResponse.json();
        
        console.log('AI Model Response received');

        // Transform AI response to match frontend format
        const transformedResponse = {
            success: true,
            customNutritionGoals: aiResult.custom_nutrition_goals || customNutritionGoals,
            weeklyMealPlan: {},
            explanation: aiResult.explanation || '',
            considerations: aiResult.considerations || []
        };

        // Transform weekly meal plan
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];

        days.forEach(day => {
            transformedResponse.weeklyMealPlan[day] = {};
            meals.forEach(meal => {
                const aiMealData = aiResult.weekly_meal_plan?.[day]?.[meal] || [];
                transformedResponse.weeklyMealPlan[day][meal] = aiMealData.map(item => {
                    // Find full food details from database
                    const foodDetails = allFoods.find(f => f._id.toString() === item.food_id);
                    
                    if (!foodDetails) {
                        console.warn(`Food not found: ${item.food_id}`);
                        return null;
                    }

                    // Calculate nutrition based on serving size
                    const servingRatio = item.amount / 100;
                    const calculatedNutrition = {
                        calories: Math.round(foodDetails.macronutrients.calories_kcal * servingRatio),
                        protein: Math.round(foodDetails.macronutrients.proteins_g * servingRatio * 10) / 10,
                        carbs: Math.round(foodDetails.macronutrients.carbohydrates_g * servingRatio * 10) / 10,
                        fat: Math.round(foodDetails.macronutrients.fats_g * servingRatio * 10) / 10,
                        fiber: Math.round(foodDetails.macronutrients.fiber_g * servingRatio * 10) / 10
                    };

                    return {
                        _id: foodDetails._id.toString(),
                        food_id: foodDetails._id.toString(),
                        name: foodDetails.name,
                        category: foodDetails.category,
                        amount: item.amount,
                        serving_unit: item.serving_unit || 'g',
                        nutrition: calculatedNutrition,
                        calculated_nutrition: calculatedNutrition,
                        vitamins: foodDetails.vitamins || {},
                        minerals: foodDetails.minerals || {},
                        rasa: foodDetails.rasa,
                        virya: foodDetails.virya,
                        vipaka: foodDetails.vipaka,
                        dosha_effects: foodDetails.dosha_effects
                    };
                }).filter(item => item !== null);
            });
        });

        res.json(transformedResponse);

    } catch (error) {
        console.log('Error generating AI diet chart:', error);
        res.json({ 
            success: false, 
            message: error.message || 'Failed to generate AI diet chart'
        });
    }
};

// API to link diet chart to prescription
const linkDietChartToPrescription = async (req, res) => {
    try {
        const { chartId, prescriptionId } = req.body;
        const doctorId = req.body.docId; // From auth middleware

        const dietChart = await dietChartModel.findById(chartId);

        if (!dietChart) {
            return res.json({ 
                success: false, 
                message: 'Diet chart not found' 
            });
        }

        // Verify doctor owns this chart
        if (dietChart.doctor_id.toString() !== doctorId) {
            return res.json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        dietChart.prescription_id = prescriptionId;
        await dietChart.save();

        res.json({ 
            success: true, 
            message: 'Diet chart linked to prescription successfully',
            dietChart 
        });

    } catch (error) {
        console.log('Error linking diet chart:', error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    undoCancellation,
    confirmAppointment,
    startAppointment,
    doctorList,
    changeAvailablity,
    appointmentComplete,
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
    clearFoodCache,
    createDietChart,
    getDietChartsByPatient,
    getDietChartsByDoctor,
    getDietChartById,
    updateDietChart,
    deleteDietChart,
    generateAIDietChart,
    linkDietChartToPrescription
}
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
import { queryRelevantFoods } from "../services/vectorService.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import transporter from "../config/nodemailer.js";
import { generatePrescriptionPDF } from "../utils/pdfGenerator.js";
import { getPrescriptionEmailTemplate } from "../utils/emailTemplate.js";
import fs from "fs";

// In-memory cache for food database
let foodCache = {
  data: null,
  timestamp: null,
  version: "1.0.0", // Increment this when food DB is updated
  ttl: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (monthly cache)
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

    return res.json({ success: true, message: "Appointment Completed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to create appointment by doctor
const createAppointmentByDoctor = async (req, res) => {
  try {
    console.log("=== CREATE APPOINTMENT REQUEST ===");
    console.log("Request body:", req.body);
    console.log("Doctor ID:", req.doctorId);

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
      console.log("Missing required fields:", { userId, slotDate, slotTime });
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

    console.log("Appointment created:", newAppointment._id);

    // Update doctor's slotsBooked array
    await doctorModel.findByIdAndUpdate(docId, {
      $push: { slotsBooked: newAppointment._id },
    });

    console.log("Updated doctor slotsBooked");

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
    const { fees, address, available, about, degree, experience, phone } =
      req.body;
    const docId = req.doctorId;

    const updateData = {};
    if (fees !== undefined) updateData.fees = fees;
    if (address !== undefined) updateData.address = address;
    if (available !== undefined) updateData.available = available;
    if (about !== undefined) updateData.about = about;
    if (degree !== undefined) updateData.degree = degree;
    if (experience !== undefined) updateData.experience = experience;
    if (phone !== undefined) updateData.phone = phone;

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

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to add a patient for a doctor
const addPatientByDoctor = async (req, res) => {
  try {
    console.log("=== ADD PATIENT REQUEST ===");
    console.log("req.body:", req.body);
    console.log("req.doctorId:", req.doctorId);
    console.log("req.headers:", req.headers);

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

    console.log("Patient data being saved:", {
      ...patientData,
      password: "[HIDDEN]",
      image: "[HIDDEN]",
    });
    console.log("Doctor ID:", docId);

    const newPatient = new userModel(patientData);
    const savedPatient = await newPatient.save();

    console.log("Patient saved successfully with doctor:", savedPatient.doctor);

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

    console.log(
      "Update patient request - patientId:",
      patientId,
      "docId:",
      docId
    );

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

    console.log(
      "Access check - hasAppointment:",
      hasAppointment,
      "isAssignedDoctor:",
      isAssignedDoctor
    );

    if (!hasAppointment && !isAssignedDoctor) {
      console.log(
        "Doctor does not have access to patient - no appointment and not assigned doctor"
      );
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
      console.log("Patient not found with ID:", patientId);
      return res.json({ success: false, message: "Patient not found" });
    }

    console.log("Patient updated successfully:", patient._id);
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
    const { filepath, filename } = await generatePrescriptionPDF(prescription, {
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

    // Send email
    const mailOptions = {
      from: fromAddress,
      to: patientEmail,
      subject: `Your Ayurvedic Prescription - ${prescription.prescriptionId}`,
      html: emailHTML,
      attachments: [
        {
          filename: `Prescription_${prescription.prescriptionId}.pdf`,
          path: filepath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully to:", patientEmail);

    // Update prescription with emailedAt timestamp
    prescription.emailedAt = new Date();
    await prescription.save();

    // Delete the temporary PDF file
    fs.unlink(filepath, (err) => {
      if (err) console.error("Error deleting PDF file:", err);
    });

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

    console.log("=== UPDATE APPOINTMENT REQUEST ===");
    console.log("Appointment ID:", appointmentId);
    console.log("Request body:", req.body);
    console.log("Doctor ID:", docId);

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

    console.log(
      "Appointment docId:",
      appointment.docId,
      "Type:",
      typeof appointment.docId
    );
    console.log("Request docId:", docId, "Type:", typeof docId);
    console.log(
      "Comparison result:",
      appointment.docId.toString() === docId.toString()
    );

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

    console.log("Appointment updated successfully:", updatedAppointment._id);

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
      console.log("Serving food data from cache (monthly cache)");
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
    console.log("Cache miss - fetching food data from database");

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

    console.log(
      `Cached ${foods.length} unique food items (by name + serving unit) for 30 days`
    );

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
  console.log("Food cache cleared");
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

    console.log("Fetching diet chart with ID:", chartId);

    let dietChart = await dietChartModel
      .findById(chartId)
      .populate("patient_id", "name email phone age gender")
      .populate("doctor_id", "name speciality email")
      .populate("prescription_id");

    if (!dietChart) {
      console.log("Diet chart not found");
      return res.json({
        success: false,
        message: "Diet chart not found",
      });
    }

    console.log("Diet chart found");
    console.log(
      "Meal plan structure:",
      JSON.stringify(dietChart.weekly_meal_plan.Mon.Breakfast, null, 2)
    );

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
          console.log(
            `${day} ${meal}: ${chartObject.weekly_meal_plan[day][meal].length} items`
          );
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

    console.log("AI Diet Chart Generation requested");
    console.log("Patient Details:", patientDetails);
    console.log("Custom Goals:", customNutritionGoals);

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

    console.log("Querying vector database for relevant foods...");

    // Query vector database for top 500 most relevant foods for maximum variety
    const relevantFoods = await queryRelevantFoods(patientDetails, 500);

    console.log(
      `Retrieved ${relevantFoods.length} relevant foods from vector DB`
    );

    // Generate custom nutrition goals if not provided or if all values are 0
    let nutritionGoals = customNutritionGoals;

    // Check if goals are all 0 (default) - if so, let AI calculate them
    const hasManualGoals =
      nutritionGoals &&
      nutritionGoals.macronutrients &&
      (nutritionGoals.macronutrients.calories > 0 ||
        nutritionGoals.macronutrients.protein > 0 ||
        nutritionGoals.macronutrients.carbs > 0);

    if (!hasManualGoals) {
      console.log(
        "No manual goals set (all 0). AI will calculate nutrition goals based on patient data..."
      );
    } else {
      console.log("Using manual nutrition goals provided by doctor");
    }

    // Build the AI prompt (no food data, foods are already in vector DB context)
    const prompt = buildGeminiDietPrompt(
      patientDetails,
      nutritionGoals,
      relevantFoods
    );

    console.log("Calling Gemini AI...");

    // Call Gemini API
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    console.log("AI Response received, parsing...");
    console.log("=".repeat(80));
    console.log("AI GENERATED DIET CHART RESPONSE:");
    console.log("=".repeat(80));
    console.log(aiResponse);
    console.log("=".repeat(80));

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

1. **Base Calorie Calculation:**
   - Start with base: 2000 kcal (female) or 2200 kcal (male)
   - Age adjustment: If age > 50, reduce by 200 kcal; if age < 25, add 200 kcal
   - BMI adjustment:
     * BMI < 18.5 (underweight): Add 300 kcal
     * BMI 25-30 (overweight): Reduce by 200 kcal
     * BMI ≥ 30 (obese): Reduce by 400 kcal
   - Constitution adjustment:
     * Vata: No change
     * Pitta: Add 100 kcal
     * Kapha: Reduce by 200 kcal
   - Bowel movement adjustment:
     * Constipation/Irregular: May need more fiber
     * Normal: No change

2. **Macronutrient Calculation:**
   - Protein: Base 50g, add 5g for Vata/Kapha, add 10g for Pitta
   - Fat: Base 65g, add 10g for Vata, reduce 5g for Pitta, reduce 10g for Kapha
   - Fiber: Base 25g, add 5g for Vata, add 10g for Kapha, add 10g for constipation
   - Carbs: Calculate from remaining calories: (Total Calories - (Protein × 4) - (Fat × 9)) ÷ 4

3. **Vitamins (Daily Recommended Intake):**
   - Vitamin A: 700 mcg (female) or 900 mcg (male)
   - Vitamin B1 (Thiamine): 1.1 mg
   - Vitamin B2 (Riboflavin): 1.1 mg
   - Vitamin B3 (Niacin): 14 mg
   - Vitamin B6: 1.3 mg
   - Vitamin B12: 2.4 mcg
   - Vitamin C: 75 mg (female) or 90 mg (male)
   - Vitamin D: 15 mcg
   - Vitamin E: 15 mg
   - Vitamin K: 90 mcg
   - Folate: 400 mcg

4. **Minerals (Daily Recommended Intake):**
   - Calcium: 1000 mg
   - Iron: 18 mg (female) or 10 mg (male)
   - Magnesium: 310 mg (female) or 400 mg (male)
   - Phosphorus: 700 mg
   - Potassium: 2600 mg
   - Sodium: 1500 mg
   - Zinc: 8 mg (female) or 11 mg (male)

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

Then create the meal plan targeting 90-98% of these calculated values (NEVER exceed 100%).
`
}

CRITICAL: If any nutrient falls short (below 90%), you MUST recommend specific Ayurvedic supplements to compensate.

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
11. Daily totals MUST achieve 90-98% of ALL nutrition targets
12. **CRITICAL HARD LIMIT: NEVER EXCEED 100% of ANY nutrient. If approaching limit, REDUCE portion sizes immediately**
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
    const { filepath, filename } = await generatePDF(
      dietChartData,
      patientData,
      doctorData
    );

    // Send file
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error("Error sending PDF:", err);
        res.json({ success: false, message: "Error downloading PDF" });
      }
      // Delete file after sending
      fs.unlinkSync(filepath);
    });
  } catch (error) {
    console.error("Error generating diet chart PDF:", error);
    res.json({ success: false, message: error.message });
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
  linkDietChartToPrescription,
  generateDietChartPDF,
};

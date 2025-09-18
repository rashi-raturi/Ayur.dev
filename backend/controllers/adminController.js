import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import { v2 as cloudinary } from "cloudinary";
import userModel from "../models/userModel.js";

// API for admin login
const loginAdmin = async (req, res) => {
    try {

    const { email, password } = req.body
    // Trim admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL.trim()
    const adminPassword = process.env.ADMIN_PASSWORD.trim()

        if (email === adminEmail && password === adminPassword) {
            const token = jwt.sign(adminEmail + adminPassword, process.env.JWT_SECRET)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: "Invalid credentials" })
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}


// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
    try {

        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API for adding Doctor
const addDoctor = async (req, res) => {

    try {

        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "Missing Details" })
        }

        // validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" })
        }

        // validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" })
        }

        // hashing user password
        const salt = await bcrypt.genSalt(10); // the more no. round the more time it will take
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
        const imageUrl = imageUpload.secure_url

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()
        res.json({ success: true, message: 'Doctor Added' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {

        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse()
        }

        res.json({ success: true, dashData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


// API to get a single doctor’s profile
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params
    const doctor = await doctorModel.findById(id).select("-password")
    if (!doctor) return res.json({ success: false, message: "Doctor not found" })
    res.json({ success: true, doctor })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

// API to update a doctor’s details
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params
    const updates = { ...req.body }

        // parse address only if sent as a JSON string
        if (updates.address && typeof updates.address === 'string') {
            updates.address = JSON.parse(updates.address)
        }

    // password change
    if (updates.password) {
      const salt = await bcrypt.genSalt(10)
      updates.password = await bcrypt.hash(updates.password, salt)
    }

    // new image upload
    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, { resource_type: "image" })
      updates.image = uploadRes.secure_url
    }

    const doctor = await doctorModel
      .findByIdAndUpdate(id, updates, { new: true })
      .select("-password")

    res.json({ success: true, doctor })
  } catch (error) {
    console.error(error)
    res.json({ success: false, message: error.message })
  }
}

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    getDoctorById,
    updateDoctor
}
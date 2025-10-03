import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from 'cloudinary'
import stripe from "stripe";

// Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

// API to register user
const registerUser = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        // checking for all data to register user
        if (!name || !email || !password) {
            return res.json({ success: false, message: 'Missing Details' })
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

        const userData = {
            name,
            email,
            password: hashedPassword,
        }

        const newUser = new userModel(userData)
        const user = await newUser.save()
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to login user
const loginUser = async (req, res) => {

    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email })

        if (!user) {
            return res.json({ success: false, message: "User does not exist" })
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
            res.json({ success: true, token })
        }
        else {
            res.json({ success: false, message: "Invalid credentials" })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user profile data
const getProfile = async (req, res) => {

    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to update user profile
const updateProfile = async (req, res) => {

    try {

        const { userId, name, phone, address, dob, gender, height, weight, bowel_movements } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })
        }

        const updateData = { 
            name, 
            phone, 
            address: JSON.parse(address), 
            dob, 
            gender 
        };

        // Add health metrics if provided
        if (height) {
            updateData.height = JSON.parse(height);
        }
        if (weight) {
            updateData.weight = parseFloat(weight);
        }
        if (bowel_movements) {
            updateData.bowel_movements = bowel_movements;
        }

        await userModel.findByIdAndUpdate(userId, updateData)

        if (imageFile) {

            // upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
            const imageURL = imageUpload.secure_url

            await userModel.findByIdAndUpdate(userId, { image: imageURL })
        }

        res.json({ success: true, message: 'Profile Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to book appointment 
const bookAppointment = async (req, res) => {

    try {

        const { 
            userId, 
            docId, 
            slotDate, 
            slotTime, 
            appointmentType = 'consultation',
            locationType = 'clinic',
            duration = 45
        } = req.body
        
        const docData = await doctorModel.findById(docId).select("-password")

        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor Not Available' })
        }

        // Check if slot is already booked by checking if appointment exists
        const existingAppointment = await appointmentModel.findOne({
            docId,
            slotDate,
            slotTime,
            cancelled: false
        });

        if (existingAppointment) {
            return res.json({ success: false, message: 'Slot Not Available' })
        }

        const appointmentData = {
            userId,
            docId,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            duration,
            status: 'scheduled',
            appointmentType,
            locationType,
            paymentMethod: 'online' // Default, can be updated later
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // Update doctor's slotsBooked array with the appointment ID
        await doctorModel.findByIdAndUpdate(docId, { 
            $push: { slotsBooked: newAppointment._id }
        })

        // Associate patient with the doctor if not already associated
        await userModel.findByIdAndUpdate(userId, {
            $setOnInsert: { doctor: docId } // Only set if patient doesn't already have a doctor
        }, { upsert: false })

        res.json({ success: true, message: 'Appointment Booked' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {

        const { userId, appointmentId, reason } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        // verify appointment user 
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancelled: true,
            status: 'cancelled',
            cancellationReason: reason || 'Cancelled by patient',
            cancelledBy: 'patient',
            cancelledAt: new Date()
        })

        // Remove appointment from doctor's slotsBooked array
        const { docId } = appointmentData
        await doctorModel.findByIdAndUpdate(docId, { 
            $pull: { slotsBooked: appointmentId }
        })

        res.json({ success: true, message: 'Appointment Cancelled' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
    try {

        const { userId } = req.body
        const appointments = await appointmentModel.find({ userId })
            .populate('docId', 'name speciality fees address image')
            .populate('userId', 'name email phone')
            .sort({ date: -1 })

        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}



// API to make payment of appointment using Stripe
const paymentStripe = async (req, res) => {
    try {

        const { appointmentId } = req.body
        const { origin } = req.headers

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (!appointmentData || appointmentData.cancelled) {
            return res.json({ success: false, message: 'Appointment Cancelled or not found' })
        }

        const currency = process.env.CURRENCY.toLocaleLowerCase()

        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: "Appointment Fees"
                },
                unit_amount: appointmentData.amount * 100
            },
            quantity: 1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${appointmentData._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${appointmentData._id}`,
            line_items: line_items,
            mode: 'payment',
        })

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const verifyStripe = async (req, res) => {
    try {

        const { appointmentId, success } = req.body

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
            return res.json({ success: true, message: 'Payment Successful' })
        }

        res.json({ success: false, message: 'Payment Failed' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }

}

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentStripe,
    verifyStripe
}

// API to fetch any user's profile by ID (for doctor/admin views)
export const getPatientProfileById = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patient = await userModel.findById(patientId).select('-password');
        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, patient });
    } catch (error) {
        console.error('Get patient profile error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
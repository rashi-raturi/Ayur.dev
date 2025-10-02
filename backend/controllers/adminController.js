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
        const appointments = await appointmentModel
            .find({})
            .populate('userId', 'name email phone address gender dob image')
            .populate('docId', 'name speciality fees image')
            .sort({ date: -1 })
        
        res.json({ success: true, appointments })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
    try {

        const { appointmentId, reason } = req.body
        await appointmentModel.findByIdAndUpdate(appointmentId, { 
            cancelled: true,
            status: 'cancelled',
            cancellationReason: reason || 'Cancelled by admin',
            cancelledBy: 'admin',
            cancelledAt: new Date()
        })

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

        // Generate registration number
        const specialityCode = speciality ? speciality.toUpperCase().substring(0, 3) : 'AYU';
        const timestamp = Date.now().toString().slice(-5); // last 5 digits of timestamp
        const registrationNumber = `${specialityCode}${timestamp}`;

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
            registrationNumber,
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
        const appointments = await appointmentModel
            .find({})
            .populate('userId', 'name')
            .populate('docId', 'name')
            .sort({ date: -1 })

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.slice(0, 10) // Get latest 10 appointments
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

// API to delete a doctor's profile
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    await doctorModel.findByIdAndDelete(id);
    res.json({ success: true, message: 'Doctor deleted' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// API to add a new patient
const addPatient = async (req, res) => {
    try {
        const { name, email, password, phone, address, gender, dob } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Name, email, and password are required" });
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

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
            dob: dob ? new Date(dob) : new Date()
        };

        const newPatient = new userModel(patientData);
        await newPatient.save();

        res.json({ success: true, message: 'Patient added successfully', patient: { ...newPatient.toObject(), password: undefined } });

    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get all patients
const allPatients = async (req, res) => {
    try {
        const patients = await userModel.find({}).select('-password');
        res.json({ success: true, patients });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to get a single patient by ID
const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await userModel.findById(id).select('-password');
        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' });
        }
        res.json({ success: true, patient });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to update a patient's details
const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

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

        // Handle image upload
        if (req.file) {
            const uploadRes = await cloudinary.uploader.upload(req.file.path, { resource_type: "image" });
            updates.image = uploadRes.secure_url;
        }

        const patient = await userModel
            .findByIdAndUpdate(id, updates, { new: true })
            .select("-password");

        if (!patient) {
            return res.json({ success: false, message: 'Patient not found' });
        }

        res.json({ success: true, patient });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

// API to delete a patient
const deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if patient has appointments
        const hasAppointments = await appointmentModel.exists({ userId: id });
        if (hasAppointments) {
            return res.json({ success: false, message: 'Cannot delete patient with existing appointments' });
        }

        await userModel.findByIdAndDelete(id);
        res.json({ success: true, message: 'Patient deleted successfully' });
    } catch (error) {
        console.error(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginAdmin,
    appointmentsAdmin,
    appointmentCancel,
    addDoctor,
    allDoctors,
    adminDashboard,
    getDoctorById,
    updateDoctor,
    deleteDoctor,
    addPatient,
    allPatients,
    getPatientById,
    updatePatient,
    deletePatient
}
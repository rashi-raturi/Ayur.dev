import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile, getPatients, addPatientByDoctor, updatePatientByDoctor, emailPrescription } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import upload from '../middleware/multer.js';
import { listDoctorPrescriptions, uploadDoctorPrescription, generatePatientSummary, createPrescription, listAllDoctorPrescriptions, updatePrescription, deletePrescription } from '../controllers/prescriptionController.js';
import { getPatientProfileById } from '../controllers/userController.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/patients", authDoctor, getPatients)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)

// Patient management by doctor
doctorRouter.post("/add-patient", authDoctor, upload.single('image'), addPatientByDoctor)
doctorRouter.put("/patient/:patientId", authDoctor, upload.single('image'), updatePatientByDoctor)

// Prescription management
doctorRouter.get("/prescriptions/:patientId", authDoctor, listDoctorPrescriptions)
doctorRouter.get("/patient-profile/:patientId", authDoctor, getPatientProfileById)
doctorRouter.post("/patient-summary/:patientId", authDoctor, generatePatientSummary)

// New prescription endpoints (put these before the parameterized routes)
doctorRouter.post("/prescription/create", authDoctor, createPrescription)
doctorRouter.put("/prescription/:id", authDoctor, updatePrescription)
doctorRouter.delete("/prescription/:id", authDoctor, deletePrescription)
doctorRouter.post("/prescription/:prescriptionId/email", authDoctor, emailPrescription)
doctorRouter.get("/prescriptions", authDoctor, listAllDoctorPrescriptions)

// File upload prescription route (put this after the specific routes)
doctorRouter.post("/prescription/:patientId", authDoctor, upload.single('prescription'), uploadDoctorPrescription)

export default doctorRouter;
import express from 'express';
import { loginDoctor, appointmentsDoctor, appointmentCancel, doctorList, changeAvailablity, appointmentComplete, doctorDashboard, doctorProfile, updateDoctorProfile } from '../controllers/doctorController.js';
import authDoctor from '../middleware/authDoctor.js';
import upload from '../middleware/multer.js';
import { listDoctorPrescriptions, uploadDoctorPrescription, generatePatientSummary } from '../controllers/prescriptionController.js';
import { getPatientProfileById } from '../controllers/userController.js';
const doctorRouter = express.Router();

doctorRouter.post("/login", loginDoctor)
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel)
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor)
doctorRouter.get("/list", doctorList)
doctorRouter.post("/change-availability", authDoctor, changeAvailablity)
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard)
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile)


doctorRouter.get("/prescriptions/:patientId", authDoctor, listDoctorPrescriptions)
doctorRouter.get("/patient-profile/:patientId", authDoctor, getPatientProfileById)
doctorRouter.post("/prescription/:patientId", authDoctor, upload.single('prescription'), uploadDoctorPrescription)
doctorRouter.post("/patient-summary/:patientId", authDoctor, generatePatientSummary)

export default doctorRouter;
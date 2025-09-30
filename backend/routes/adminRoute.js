import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, getDoctorById, updateDoctor, deleteDoctor, addPatient, allPatients, getPatientById, updatePatient, deletePatient } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)

// Doctor management routes
adminRouter.get("/doctor/:id", authAdmin, getDoctorById)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.put("/doctor/:id", authAdmin, upload.single("image"), updateDoctor)
adminRouter.delete("/doctor/:id", authAdmin, deleteDoctor)

// Patient management routes
adminRouter.get("/patient/:id", authAdmin, getPatientById)
adminRouter.get("/all-patients", authAdmin, allPatients)
adminRouter.post("/add-patient", authAdmin, upload.single('image'), addPatient)
adminRouter.put("/patient/:id", authAdmin, upload.single("image"), updatePatient)
adminRouter.delete("/patient/:id", authAdmin, deletePatient)

// Appointment management routes
adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)

adminRouter.get("/dashboard", authAdmin, adminDashboard)

export default adminRouter;
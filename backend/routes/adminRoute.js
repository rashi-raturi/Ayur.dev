import express from 'express';
import { loginAdmin, appointmentsAdmin, appointmentCancel, addDoctor, allDoctors, adminDashboard, getDoctorById, updateDoctor, deleteDoctor } from '../controllers/adminController.js';
import { changeAvailablity } from '../controllers/doctorController.js';
import authAdmin from '../middleware/authAdmin.js';
import upload from '../middleware/multer.js';
const adminRouter = express.Router();

adminRouter.post("/login", loginAdmin)

adminRouter.get("/doctor/:id", authAdmin, getDoctorById)
adminRouter.get("/all-doctors", authAdmin, allDoctors)
adminRouter.post("/add-doctor", authAdmin, upload.single('image'), addDoctor)
adminRouter.post("/change-availability", authAdmin, changeAvailablity)
adminRouter.put("/doctor/:id", authAdmin, upload.single("image"), updateDoctor)
adminRouter.delete("/doctor/:id", authAdmin, deleteDoctor)

adminRouter.get("/appointments", authAdmin, appointmentsAdmin)
adminRouter.post("/cancel-appointment", authAdmin, appointmentCancel)

adminRouter.get("/dashboard", authAdmin, adminDashboard)



export default adminRouter;
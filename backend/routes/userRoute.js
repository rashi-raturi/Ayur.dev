import express from 'express';
import { loginUser, registerUser, getProfile, updateProfile, bookAppointment, listAppointment, listDietCharts, cancelAppointment, paymentStripe, verifyStripe, getPatientProfileById } from '../controllers/userController.js';
import { uploadDoctorPrescription, listPrescriptions } from '../controllers/prescriptionController.js';

import upload from '../middleware/multer.js';
import authUser from '../middleware/authUser.js';
const userRouter = express.Router();

userRouter.post("/register", registerUser)
userRouter.post("/login", loginUser)

userRouter.get("/get-profile", authUser, getProfile)
userRouter.post("/update-profile", upload.single('image'), authUser, updateProfile)
userRouter.post("/book-appointment", authUser, bookAppointment)
userRouter.get("/appointments", authUser, listAppointment)
userRouter.post("/cancel-appointment", authUser, cancelAppointment)
userRouter.post("/payment-stripe", authUser, paymentStripe)
userRouter.post("/verifyStripe", authUser, verifyStripe)

userRouter.get("/prescriptions", authUser, listPrescriptions)
userRouter.get("/diet-charts", authUser, listDietCharts)

userRouter.get("/patient-profile/:patientId", authUser, getPatientProfileById)

export default userRouter;
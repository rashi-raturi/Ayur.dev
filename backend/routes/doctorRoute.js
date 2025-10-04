import express from "express";
import {
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
  createDietChart,
  getDietChartsByPatient,
  getDietChartsByDoctor,
  getDietChartById,
  updateDietChart,
  deleteDietChart,
  generateAIDietChart,
  linkDietChartToPrescription,
  generateDietChartPDF,
} from "../controllers/doctorController.js";
import authDoctor from "../middleware/authDoctor.js";
import upload from "../middleware/multer.js";
import {
  listDoctorPrescriptions,
  uploadDoctorPrescription,
  generatePatientSummary,
  createPrescription,
  listAllDoctorPrescriptions,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescriptionController.js";
import { getPatientProfileById } from "../controllers/userController.js";
const doctorRouter = express.Router();

doctorRouter.post("/signup", upload.single("image"), signupDoctor);
doctorRouter.post("/login", loginDoctor);
doctorRouter.post("/cancel-appointment", authDoctor, appointmentCancel);
doctorRouter.put(
  "/undo-cancellation/:appointmentId",
  authDoctor,
  undoCancellation
);
doctorRouter.post("/confirm-appointment", authDoctor, confirmAppointment);
doctorRouter.post("/start-appointment", authDoctor, startAppointment);
doctorRouter.post("/create-appointment", authDoctor, createAppointmentByDoctor);
doctorRouter.put(
  "/update-appointment/:appointmentId",
  authDoctor,
  updateAppointmentByDoctor
);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctor);
doctorRouter.get("/patients", authDoctor, getPatients);
doctorRouter.get("/list", doctorList);
doctorRouter.post("/change-availability", authDoctor, changeAvailablity);
doctorRouter.post("/complete-appointment", authDoctor, appointmentComplete);
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile);
doctorRouter.post("/update-profile", authDoctor, updateDoctorProfile);

// Food database
doctorRouter.get("/foods", authDoctor, getFoodDatabase);

// Diet Chart management
doctorRouter.post("/diet-chart/create", authDoctor, createDietChart);
doctorRouter.post("/diet-chart/generate-ai", authDoctor, generateAIDietChart);
doctorRouter.get("/diet-charts", authDoctor, getDietChartsByDoctor);
doctorRouter.get("/diet-chart/:chartId", authDoctor, getDietChartById);
doctorRouter.post("/diet-chart/:chartId/pdf", authDoctor, generateDietChartPDF);
doctorRouter.get(
  "/diet-charts/patient/:patientId",
  authDoctor,
  getDietChartsByPatient
);
doctorRouter.put("/diet-chart/:chartId", authDoctor, updateDietChart);
doctorRouter.delete("/diet-chart/:chartId", authDoctor, deleteDietChart);
doctorRouter.post(
  "/diet-chart/link-prescription",
  authDoctor,
  linkDietChartToPrescription
);

// Patient management by doctor
doctorRouter.post(
  "/add-patient",
  authDoctor,
  upload.single("image"),
  addPatientByDoctor
);
doctorRouter.put(
  "/patient/:patientId",
  authDoctor,
  upload.single("image"),
  updatePatientByDoctor
);

// Prescription management
doctorRouter.get(
  "/prescriptions/:patientId",
  authDoctor,
  listDoctorPrescriptions
);
doctorRouter.get(
  "/patient-profile/:patientId",
  authDoctor,
  getPatientProfileById
);
doctorRouter.post(
  "/patient-summary/:patientId",
  authDoctor,
  generatePatientSummary
);

// New prescription endpoints (put these before the parameterized routes)
doctorRouter.post("/prescription/create", authDoctor, createPrescription);
doctorRouter.put("/prescription/:id", authDoctor, updatePrescription);
doctorRouter.delete("/prescription/:id", authDoctor, deletePrescription);
doctorRouter.post(
  "/prescription/:prescriptionId/email",
  authDoctor,
  emailPrescription
);
doctorRouter.get("/prescriptions", authDoctor, listAllDoctorPrescriptions);

// File upload prescription route (put this after the specific routes)
doctorRouter.post(
  "/prescription/:patientId",
  authDoctor,
  upload.single("prescription"),
  uploadDoctorPrescription
);

export default doctorRouter;

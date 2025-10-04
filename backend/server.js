import express from "express";
import cors from "cors";
import compression from "compression";
import "dotenv/config";
import path from "path";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import { connectHISDatabase } from "./config/hisDatabase.js";
import userRouter from "./routes/userRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import adminRouter from "./routes/adminRoute.js";
import hisRouter from "./routes/hisRoute.js";

// app config
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

// Initialize HIS Database Connection
connectHISDatabase().catch(console.error);

// middlewares
// Compression middleware (should be early in the chain)
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (0-9), 6 is a good balance between speed and compression
  })
);

// JSON body parsing and CORS
app.use(express.json());
app.use(cors());

// serve prescription uploads from uploads/prescriptions
app.use(
  "/uploads/prescriptions",
  express.static(path.join(process.cwd(), "uploads/prescriptions"))
);

// api endpoints
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/his", hisRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.listen(port, () => console.log(`Server started on PORT:${port}`));

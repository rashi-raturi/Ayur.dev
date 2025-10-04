import mongoose from "mongoose";
import { getHISConnection } from "../config/hisDatabase.js";

// HIS Patient Schema for Hospital Information System
const hisPatientSchema = new mongoose.Schema(
  {
    // Primary Identifiers
    hisPatientId: {
      type: String,
      required: true,
      unique: true,
    },
    hospitalId: {
      type: String,
      required: true,
      default: "AYUR_HOSP_001",
    },

    // Personal Information
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },

    // Contact Information
    primaryPhone: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryPhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true, default: "India" },
    },

    // Medical Information
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    constitution: {
      type: String,
      required: true,
      enum: [
        "Vata",
        "Pitta",
        "Kapha",
        "Vata-Pitta",
        "Pitta-Kapha",
        "Vata-Kapha",
        "Tridosha",
      ],
    },
    height: {
      feet: { type: Number, required: true },
      inches: { type: Number, required: true },
      totalCm: { type: Number, required: true },
    },
    weight: {
      type: Number,
      required: true, // in kg
    },
    bmi: {
      type: Number,
      required: true,
    },

    // Medical History
    chronicConditions: [
      {
        condition: { type: String, required: true },
        diagnosedDate: { type: Date, required: true },
        severity: {
          type: String,
          enum: ["Mild", "Moderate", "Severe", "Critical"],
          default: "Mild",
        },
      },
    ],
    allergies: [String],
    currentMedications: [String],

    // System Status
    patientStatus: {
      type: String,
      enum: ["Active", "Inactive", "Discharged", "Transferred"],
      default: "Active",
    },
    isEligibleForDietPlanning: {
      type: Boolean,
      default: true,
    },
    lastVisitDate: {
      type: Date,
      required: true,
    },

    // Integration Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    syncedWithAyurvedicSystem: {
      type: Boolean,
      default: false,
    },
    lastSyncDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: "hispatients",
  }
);

// Indexes for better query performance
hisPatientSchema.index({ fullName: "text", email: "text" });
hisPatientSchema.index({ hospitalId: 1 });
hisPatientSchema.index({ patientStatus: 1, isEligibleForDietPlanning: 1 });
hisPatientSchema.index({ lastVisitDate: -1 });

// Virtual for full address
hisPatientSchema.virtual("fullAddress").get(function () {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.pincode}`;
});

// Pre-save middleware to update fullName and BMI
hisPatientSchema.pre("save", function (next) {
  this.fullName = `${this.firstName} ${this.lastName}`;
  this.bmi = Number(
    (this.weight / Math.pow(this.height.totalCm / 100, 2)).toFixed(1)
  );
  this.updatedAt = new Date();
  next();
});

// Create model using HIS database connection
let HISPatientModel;

try {
  const hisConnection = getHISConnection();
  HISPatientModel = hisConnection.model("HISPatient", hisPatientSchema);
} catch (error) {
  // Model will be created when connection is established
  HISPatientModel = null;
}

// Function to get model with connection
const getHISPatientModel = async () => {
  if (!HISPatientModel) {
    const { connectHISDatabase } = await import("../config/hisDatabase.js");
    const connection = await connectHISDatabase();
    HISPatientModel = connection.model("HISPatient", hisPatientSchema);
  }
  return HISPatientModel;
};

export default HISPatientModel;
export { getHISPatientModel };

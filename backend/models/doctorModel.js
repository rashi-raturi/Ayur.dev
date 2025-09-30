import mongoose from "mongoose";

// Sub-schema for address
const addressSchema = new mongoose.Schema({
    line1: { type: String, required: true },
    line2: { type: String },
    // city: { type: String, required: true },
    // state: { type: String, required: true },
    // zip: { type: String }
}, { _id: false });

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String },
    speciality: { type: String, required: true },
    degree: { type: String },
    experience: { type: String },
    about: { type: String },
    available: { type: Boolean, default: true },
    fees: { type: Number },
    registrationNumber: { type: String, required: true, unique: true}, 
    address: { type: addressSchema},
    slotsBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'appointment' }]
}, { timestamps: true });

const doctorModel = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);
export default doctorModel;
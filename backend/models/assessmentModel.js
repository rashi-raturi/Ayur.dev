import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    inputData: { type: Object, required: true },
    resultData: { type: Object, required: true },
    date: { type: Number, default: Date.now },
    // Recommendations mapping for each dosha
    recommendations: { type: Object, required: true }
});

const assessmentModel = mongoose.models.assessment || mongoose.model("assessment", assessmentSchema);
export default assessmentModel;

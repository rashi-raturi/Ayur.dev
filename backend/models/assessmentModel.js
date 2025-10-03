import mongoose from "mongoose";

const recommendationSubSchema = new mongoose.Schema({
    dosha: { type: String, required: true },
    tips: [{ type: String }]
}, { _id: false });

const assessmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    inputData: { type: mongoose.Schema.Types.Mixed, required: true },
    resultData: { type: mongoose.Schema.Types.Mixed, required: true },
    recommendations: [recommendationSubSchema],
    date: { type: Date, default: Date.now }
}, { timestamps: true });

const assessmentModel = mongoose.models.assessment || mongoose.model("assessment", assessmentSchema);
export default assessmentModel;

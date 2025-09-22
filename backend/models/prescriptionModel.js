import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	date: { type: Date },
	patientName: { type: String },
	doctorName: { type: String },
	symptoms: [{ type: String }],
	medicine: [{ type: String }],
	recommendations: [{ type: String }],
	notes: { type: String },
	filePath: { type: String }
}, { timestamps: true });

export default mongoose.model('Prescription', prescriptionSchema);

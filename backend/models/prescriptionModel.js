import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
	patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
	doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
	date: { type: Date, default: Date.now },
	
	// Doctor Information (stored for reference)
	doctorInfo: {
		name: { type: String, required: true },
		registrationNumber: { type: String, required: false }, // Made optional for backward compatibility
		speciality: { type: String }
	},
	
	// Patient Information (stored for reference)
	patientInfo: {
		name: { type: String, required: true },
		age: { type: Number, required: true },
		gender: { type: String, required: true },
		contactNumber: { type: String, required: true },
		constitution: { type: String } // Prakriti
	},
	
	// Clinical Assessment
	chiefComplaint: { type: String, required: true },
	diagnosis: { type: String },
	
	// Medications & Formulations
	medications: [{
		name: { type: String, required: true },
		dosage: { type: String, required: true },
		frequency: { type: String },
		duration: { type: String },
		timing: { type: String },
		instructions: { type: String }
	}],
	
	// Recommendations
	dietaryRecommendations: { type: String },
	lifestyleAdvice: { type: String },
	followUpDate: { type: Date },
	
	// Status and metadata
	status: { type: String, enum: ['Active', 'Completed', 'Draft'], default: 'Active' }
}, { timestamps: true });

export default mongoose.model('Prescription', prescriptionSchema);

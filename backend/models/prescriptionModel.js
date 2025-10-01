import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
	prescriptionId: { type: String, unique: true }, // P01, P02, etc.
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
	
	// Email tracking
	emailedAt: { type: Date }, // Date and time when prescription was emailed to patient
	
	// Status and metadata
	status: { type: String, enum: ['Draft', 'Active', 'Dispensed'], default: 'Draft' }
}, { timestamps: true });

// Pre-save hook to generate unique prescriptionId
prescriptionSchema.pre('save', async function(next) {
	if (!this.prescriptionId) {
		try {
			// Find the highest prescriptionId
			const lastPrescription = await this.constructor.findOne({}, { prescriptionId: 1 })
				.sort({ prescriptionId: -1 })
				.limit(1);
			
			if (lastPrescription && lastPrescription.prescriptionId) {
				// Extract number from format P01, P02, etc.
				const lastNumber = parseInt(lastPrescription.prescriptionId.substring(1));
				const newNumber = lastNumber + 1;
				this.prescriptionId = `P${String(newNumber).padStart(2, '0')}`;
			} else {
				// First prescription
				this.prescriptionId = 'P01';
			}
		} catch (error) {
			return next(error);
		}
	}
	next();
});

export default mongoose.model('Prescription', prescriptionSchema);

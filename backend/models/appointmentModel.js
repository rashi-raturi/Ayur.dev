import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
  // References to User and Doctor
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
  
  // Appointment Details
  slotDate: { type: String, required: true },
  slotTime: { type: String, required: true },
  duration: { type: Number, default: 45 }, // Duration in minutes (e.g., 45min, 30min, 60min)
  
  // Status Information
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  cancelled: { type: Boolean, default: false },
  isCompleted: { type: Boolean, default: false },
  
  // Appointment Type and Location
  appointmentType: { 
    type: String, 
    enum: ['consultation', 'follow-up', 'emergency'], 
    default: 'consultation' 
  },
  locationType: { 
    type: String, 
    enum: ['clinic', 'online', 'home-visit'], 
    default: 'clinic' 
  },
  
  // Payment Information
  amount: { type: Number, required: true },
  payment: { type: Boolean, default: false },
  paymentMethod: { 
    type: String, 
    enum: ['online', 'cash', 'card', 'insurance'], 
    default: 'cash' 
  },
  
  // Reminder and Notification
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  
  // Legacy date field (keeping for backward compatibility)
  date: { type: Number, required: true },
  
  // Prescription Reference (will be set when prescription is created for this appointment)
  prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  
  // Cancellation information
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['patient', 'doctor', 'admin'] },
  cancelledAt: { type: Date }
  
}, { timestamps: true });

// Index for efficient queries
appointmentSchema.index({ docId: 1, slotDate: 1, status: 1 });
appointmentSchema.index({ userId: 1, status: 1 });

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel
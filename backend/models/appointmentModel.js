import mongoose from "mongoose"

const appointmentSchema = new mongoose.Schema({
  // References to User and Doctor
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  docId: { type: mongoose.Schema.Types.ObjectId, ref: 'doctor', required: true },
    slotDate: { type: String, required: true },
    slotTime: { type: String, required: true },
    // Removed embedded userData/docData; populate references when needed
    amount: { type: Number, required: true },
    date: { type: Number, required: true },
    cancelled: { type: Boolean, default: false },
    payment: { type: Boolean, default: false },
        isCompleted: { type: Boolean, default: false },
        // Array of patient reports associated with the appointment
        reports: {
          type: [
            {
              title: { type: String, required: true },
              url: { type: String, required: true },
              date: { type: Number, required: true }
            }
          ],
          default: []
        }
  }, { timestamps: true });

const appointmentModel = mongoose.models.appointment || mongoose.model("appointment", appointmentSchema)
export default appointmentModel
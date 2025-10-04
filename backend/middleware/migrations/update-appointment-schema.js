import mongoose from 'mongoose';
import dotenv from 'dotenv';
import appointmentModel from '../../models/appointmentModel.js';

dotenv.config();

const updateAppointmentSchema = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all appointments
    const appointments = await appointmentModel.find({});
    console.log(`Found ${appointments.length} appointments to update`);

    let updatedCount = 0;

    for (const appointment of appointments) {
      const updates = {};

      // Set status based on existing fields
      if (appointment.cancelled) {
        updates.status = 'cancelled';
      } else if (appointment.isCompleted) {
        updates.status = 'completed';
      } else if (appointment.payment) {
        updates.status = 'confirmed';
      } else {
        updates.status = 'scheduled';
      }

      // Set default duration if not set
      if (!appointment.duration) {
        updates.duration = 45;
      }

      // Set default appointment type (convert telemedicine to consultation)
      if (!appointment.appointmentType || appointment.appointmentType === 'telemedicine') {
        updates.appointmentType = 'consultation';
      }

      // Set default location type
      if (!appointment.locationType) {
        updates.locationType = 'clinic';
      }

      // Set payment method based on payment status
      if (!appointment.paymentMethod) {
        updates.paymentMethod = appointment.payment ? 'online' : 'cash';
      }

      // Set reminder status
      if (appointment.reminderSent === undefined) {
        updates.reminderSent = false;
      }

      // Remove deprecated fields by unsetting them
      const unsetFields = {};
      if (appointment.isNewPatient !== undefined) unsetFields.isNewPatient = '';
      if (appointment.symptoms !== undefined) unsetFields.symptoms = '';
      if (appointment.notes !== undefined) unsetFields.notes = '';
      if (appointment.reports !== undefined) unsetFields.reports = '';
      if (appointment.isFollowUp !== undefined) unsetFields.isFollowUp = '';
      if (appointment.previousAppointmentId !== undefined) unsetFields.previousAppointmentId = '';
      if (appointment.nextFollowUpDate !== undefined) unsetFields.nextFollowUpDate = '';

      // Update the appointment
      const updateQuery = { $set: updates };
      if (Object.keys(unsetFields).length > 0) {
        updateQuery.$unset = unsetFields;
      }
      
      await appointmentModel.findByIdAndUpdate(appointment._id, updateQuery);
      updatedCount++;

      if (updatedCount % 10 === 0) {
        console.log(`Updated ${updatedCount} appointments...`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} appointments`);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the migration
updateAppointmentSchema();

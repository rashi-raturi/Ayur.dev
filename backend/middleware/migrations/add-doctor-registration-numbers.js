import mongoose from 'mongoose';
import doctorModel from '../models/doctorModel.js';

// Migration to add registration numbers to existing doctors
async function addDoctorRegistrationNumbers() {
  try {
    console.log('Starting migration: Adding registration numbers to doctors...');
    
    // Get all doctors without registration numbers
    const doctors = await doctorModel.find({ 
      $or: [
        { registrationNumber: { $exists: false } },
        { registrationNumber: null },
        { registrationNumber: '' }
      ]
    });

    console.log(`Found ${doctors.length} doctors without registration numbers`);

    if (doctors.length === 0) {
      console.log('No doctors need registration numbers. Migration complete.');
      return;
    }

    // Update each doctor with a generated registration number
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      
      // Generate registration number based on speciality and index
      const specialityCode = doctor.speciality ? 
        doctor.speciality.toUpperCase().substring(0, 3) : 'AYU';
      const registrationNumber = `${specialityCode}${String(i + 12345).padStart(5, '0')}`;
      
      await doctorModel.findByIdAndUpdate(doctor._id, {
        registrationNumber: registrationNumber
      });

      console.log(`Updated doctor ${doctor.name} with registration number: ${registrationNumber}`);
    }

    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Connect to MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://rashi:rashi1234@cluster0.ew7ia.mongodb.net/prescripto';
  
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB');
      await addDoctorRegistrationNumbers();
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}

export default addDoctorRegistrationNumbers;
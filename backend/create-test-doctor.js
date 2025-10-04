import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import doctorModel from './models/doctorModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function createTestDoctor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    const testDoctor = new doctorModel({
      name: 'Dr. Test Doctor',
      email: 'test@doctor.com',
      password: hashedPassword,
      speciality: 'General Ayurvedic Practitioner',
      degree: 'BAMS (Bachelor of Ayurvedic Medicine and Surgery)',
      experience: '5 Years',
      about: 'Test doctor account for development',
      address: { line1: 'Test Address', line2: '' },
      registrationNumber: 'TEST123456',
      phone: '1234567890',
      fees: 50,
      available: true
    });

    await testDoctor.save();
    console.log('✅ Test doctor created successfully!');
    console.log('📧 Email: test@doctor.com');
    console.log('🔑 Password: test123');

  } catch (error) {
    if (error.code === 11000) {
      console.log('✅ Test doctor already exists!');
      console.log('📧 Email: test@doctor.com');
      console.log('🔑 Password: test123');
    } else {
      console.error('❌ Error creating test doctor:', error);
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createTestDoctor();
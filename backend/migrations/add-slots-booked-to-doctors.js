import mongoose from 'mongoose';
import doctorModel from '../models/doctorModel.js';
import 'dotenv/config';

const addSlotsbookedToAllDoctors = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all doctors that don't have slots_booked field
        const result = await doctorModel.updateMany(
            { slots_booked: { $exists: false } },
            { $set: { slots_booked: {} } }
        );

        console.log(`✅ Updated ${result.modifiedCount} doctors with slots_booked field`);

        // Also set default empty object for doctors that have null or undefined
        const result2 = await doctorModel.updateMany(
            { $or: [{ slots_booked: null }, { slots_booked: undefined }] },
            { $set: { slots_booked: {} } }
        );

        console.log(`✅ Updated ${result2.modifiedCount} doctors with null/undefined slots_booked`);

        // Display all doctors with their slots_booked status
        const doctors = await doctorModel.find({}, 'name email slots_booked');
        console.log('\nAll doctors after migration:');
        doctors.forEach(doc => {
            console.log(`- ${doc.name} (${doc.email}): slots_booked = ${JSON.stringify(doc.slots_booked)}`);
        });

        console.log('\n✨ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

addSlotsbookedToAllDoctors();

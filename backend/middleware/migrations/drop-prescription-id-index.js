import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function dropPrescriptionIdIndex() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('prescriptions');

        // Check if the index exists
        const indexes = await collection.indexes();
        const prescriptionIdIndex = indexes.find(index => 
            index.name === 'prescriptionId_1' || 
            (index.key && index.key.prescriptionId)
        );

        if (prescriptionIdIndex) {
            console.log('Found prescriptionId index:', prescriptionIdIndex.name);
            
            // Drop the index
            await collection.dropIndex(prescriptionIdIndex.name);
            console.log('Successfully dropped prescriptionId index');
        } else {
            console.log('prescriptionId index not found');
        }

        // Optionally, remove the prescriptionId field from existing documents
        const result = await collection.updateMany(
            { prescriptionId: { $exists: true } },
            { $unset: { prescriptionId: "" } }
        );
        
        console.log(`Removed prescriptionId field from ${result.modifiedCount} documents`);

    } catch (error) {
        console.error('Error dropping index:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run the migration
dropPrescriptionIdIndex();
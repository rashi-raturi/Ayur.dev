import { embedAllFoods, checkEmbeddingStatus } from './services/vectorService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupVectorDatabase() {
    try {
        console.log('🚀 Starting Vector Database Setup for Ayurveda Foods');
        console.log('='.repeat(60));

        // Connect to MongoDB first
        console.log('\n🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');

        // Check current status
        console.log('\n📊 Checking current embedding status...');
        const status = await checkEmbeddingStatus();
        console.log(`Current vectors in database: ${status.totalVectors}`);
        console.log(`Dimension: ${status.dimension}`);
        console.log(`Ready: ${status.isReady ? '✅' : '❌'}`);

        if (status.isReady && status.totalVectors > 0) {
            console.log('\n⚠️  Vector database already contains embeddings.');
            console.log(`Would you like to re-embed all foods? This will replace existing data.`);
            console.log('(Press Ctrl+C to cancel, or wait 5 seconds to continue...)\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Embed all foods
        console.log('\n🔄 Embedding all foods into vector database...');
        console.log('This may take several minutes depending on the number of foods.\n');

        const result = await embedAllFoods();

        console.log('\n' + '='.repeat(60));
        console.log('✅ Vector Database Setup Complete!');
        console.log('='.repeat(60));
        console.log(`Total foods embedded: ${result.count}`);
        console.log(`Unique foods by name: ${result.uniqueCount || result.count}`);
        console.log('\n📝 Next Steps:');
        console.log('1. The AI diet chart generator will now use vector search');
        console.log('2. All foods are embedded and ready for semantic search');
        console.log('3. No need to send food data with each request');
        console.log('4. AI will retrieve only relevant foods per patient\n');

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error setting up vector database:', error);
        console.error('\nPlease check:');
        console.error('1. PINECONE_API_KEY is set in .env');
        console.error('2. GEMINI_API_KEY is set in .env');
        console.error('3. MONGODB_URI is set in .env');
        console.error('4. MongoDB connection is working');
        console.error('5. Food database has data\n');
        
        // Close MongoDB connection if open
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        
        process.exit(1);
    }
}

setupVectorDatabase();

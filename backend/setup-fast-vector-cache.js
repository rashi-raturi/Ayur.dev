import { embedAllFoods, checkEmbeddingStatus, clearEmbeddings } from './services/fastVectorService.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function setupFastVectorCache() {
    try {
        console.log('⚡ Starting Fast Vector Cache Setup for Ayurveda Foods');
        console.log('='.repeat(60));

        // Connect to MongoDB first
        console.log('\n🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected successfully');

        // Check current status
        console.log('\n📊 Checking current cache status...');
        const status = await checkEmbeddingStatus();
        console.log(`Current vectors in cache: ${status.totalVectors}`);
        console.log(`Dimension: ${status.dimension}`);
        console.log(`Ready: ${status.isReady ? '✅' : '❌'}`);
        console.log(`Engine: ${status.engine || 'FastVector'}`);

        if (status.isReady && status.totalVectors > 0) {
            console.log('\n⚠️  Vector cache already exists with embeddings.');
            console.log('Options:');
            console.log('1. Keep existing cache (recommended if up to date)');
            console.log('2. Rebuild cache (will take 5-15 minutes for 5000 foods)');
            console.log('\nTo rebuild, run: npm run rebuild-vector-cache');
            console.log('To clear cache, run: npm run clear-vector-cache\n');
            
            await mongoose.connection.close();
            process.exit(0);
        }

        // Embed selected foods (max 5000 for performance)
        console.log('\n🔄 Building optimized vector cache...');
        console.log('⚡ Processing top 5000 most nutritionally complete foods');
        console.log('This will take approximately 5-15 minutes.\n');

        const result = await embedAllFoods();

        console.log('\n' + '='.repeat(60));
        console.log('✅ Fast Vector Cache Setup Complete!');
        console.log('='.repeat(60));
        console.log(`📊 Total foods in database: ${result.totalCount}`);
        console.log(`✨ Unique foods identified: ${result.uniqueCount || result.totalCount}`);
        console.log(`⚡ Foods embedded in cache: ${result.count}`);
        console.log('\n📝 Performance Benefits:');
        console.log('✓ Lightning-fast food retrieval (milliseconds)');
        console.log('✓ No API rate limits (local cache)');
        console.log('✓ Diet chart generation in seconds');
        console.log('✓ Cache persists across server restarts');
        console.log('\n💡 The cache is stored in: ./fast_vector_cache.json');
        console.log('💡 Cache will be automatically loaded on server startup\n');

        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Error setting up fast vector cache:', error);
        console.error('\nPlease check:');
        console.error('1. HUGGINGFACE_API_KEY is set in .env');
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

// Script to rebuild cache (force rebuild)
async function rebuildCache() {
    try {
        console.log('🔨 Force Rebuilding Vector Cache...\n');
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected\n');
        
        // Clear existing cache
        console.log('🗑️  Clearing existing cache...');
        await clearEmbeddings();
        console.log('✅ Cache cleared\n');
        
        // Rebuild
        console.log('🔄 Rebuilding optimized cache...');
        const result = await embedAllFoods();
        
        console.log('\n✅ Cache rebuilt successfully!');
        console.log(`⚡ ${result.count} foods embedded\n`);
        
        await mongoose.connection.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error rebuilding cache:', error);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
        process.exit(1);
    }
}

// Check which command to run
const command = process.argv[2];

if (command === 'rebuild') {
    rebuildCache();
} else {
    setupFastVectorCache();
}

import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY
});

const INDEX_NAME = 'ayurveda-foods';

async function resetIndex() {
    try {
        console.log('🔄 Resetting Pinecone index...\n');

        // Check if index exists
        const indexes = await pinecone.listIndexes();
        const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);

        if (indexExists) {
            console.log(`🗑️  Deleting existing index: ${INDEX_NAME}`);
            await pinecone.deleteIndex(INDEX_NAME);
            console.log('✅ Old index deleted successfully');
            
            // Wait for deletion to complete
            console.log('⏳ Waiting 10 seconds for deletion to complete...');
            await new Promise(resolve => setTimeout(resolve, 10000));
        } else {
            console.log(`ℹ️  Index "${INDEX_NAME}" does not exist yet`);
        }

        // Create new index with 384 dimensions (Hugging Face)
        console.log('\n📦 Creating new index with 384 dimensions (Hugging Face embeddings)...');
        await pinecone.createIndex({
            name: INDEX_NAME,
            dimension: 384, // Changed from 768 to 384
            metric: 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-east-1'
                }
            }
        });

        console.log('✅ New index created successfully');
        console.log('⏳ Waiting 10 seconds for index to be ready...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        console.log('\n✨ Index reset complete!');
        console.log('📝 Next step: Run "node setup-vector-db.js" to embed foods');
        
    } catch (error) {
        console.error('❌ Error resetting index:', error);
        throw error;
    }
}

resetIndex()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

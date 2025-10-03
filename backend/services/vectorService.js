import { Pinecone } from '@pinecone-database/pinecone';
import foodModel from '../models/foodModel.js';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Pinecone
const API_KEY = process.env.PINECONE_API_KEY

const pinecone = new Pinecone({
    apiKey: API_KEY
});

const INDEX_NAME = 'ayurveda-foods';
const DIMENSION = 384; // BAAI/bge-small-en-v1.5 dimension
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// Get or create Pinecone index
async function getIndex() {
    try {
        const indexes = await pinecone.listIndexes();
        const indexExists = indexes.indexes?.some(idx => idx.name === INDEX_NAME);

        if (!indexExists) {
            console.log(`Creating Pinecone index: ${INDEX_NAME}`);
            await pinecone.createIndex({
                name: INDEX_NAME,
                dimension: DIMENSION,
                metric: 'cosine',
                spec: {
                    serverless: {
                        cloud: 'aws',
                        region: 'us-east-1'
                    }
                }
            });
            // Wait for index to be ready
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        return pinecone.index(INDEX_NAME);
    } catch (error) {
        console.error('Error getting Pinecone index:', error);
        throw error;
    }
}

// Generate embedding using Hugging Face (Free, no quota issues!)
async function generateEmbedding(text) {
    try {
        const response = await fetch(HUGGINGFACE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(HUGGINGFACE_API_KEY && { 'Authorization': `Bearer ${HUGGINGFACE_API_KEY}` })
            },
            body: JSON.stringify({
                inputs: text,
                options: {
                    wait_for_model: true,
                    use_cache: false
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        // Hugging Face returns embeddings in different formats depending on the model
        // For sentence-transformers, it typically returns a 2D array or direct array
        if (Array.isArray(result)) {
            if (Array.isArray(result[0]) && typeof result[0][0] === 'number') {
                // 2D array - return first embedding
                return result[0];
            } else if (typeof result[0] === 'number') {
                // Already a 1D array of numbers
                return result;
            }
        }
        
        throw new Error(`Unexpected embedding format: ${JSON.stringify(result).substring(0, 200)}`);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

// Create rich text representation of food for embedding
function createFoodEmbeddingText(food) {
    const parts = [
        `Food: ${food.name}`,
        `Category: ${food.category}`,
        `Diet Type: ${food.diet_type || 'General'}`,
    ];

    // Nutritional info
    if (food.macronutrients) {
        parts.push(`Calories: ${food.macronutrients.calories_kcal || 0} kcal`);
        parts.push(`Protein: ${food.macronutrients.proteins_g || 0}g`);
        parts.push(`Carbs: ${food.macronutrients.carbohydrates_g || 0}g`);
        parts.push(`Fat: ${food.macronutrients.fats_g || 0}g`);
        parts.push(`Fiber: ${food.macronutrients.fiber_g || 0}g`);
    }

    // Ayurvedic properties
    if (food.rasa && Array.isArray(food.rasa)) {
        parts.push(`Taste: ${food.rasa.join(', ')}`);
    }
    if (food.virya) {
        parts.push(`Energy: ${food.virya}`);
    }
    if (food.vipaka) {
        parts.push(`Post-digestive effect: ${food.vipaka}`);
    }

    // Dosha effects
    if (food.dosha_effects) {
        const doshaEffects = [];
        for (const [dosha, effect] of Object.entries(food.dosha_effects)) {
            doshaEffects.push(`${dosha}: ${effect}`);
        }
        parts.push(`Dosha effects: ${doshaEffects.join(', ')}`);
    }

    // Health benefits
    if (food.health_benefits && Array.isArray(food.health_benefits)) {
        parts.push(`Benefits: ${food.health_benefits.join(', ')}`);
    }

    return parts.join('. ');
}

// Embed all foods from database into Pinecone
export async function embedAllFoods() {
    try {
        console.log('Starting food embedding process...');
        
        const index = await getIndex();
        const allFoods = await foodModel.find({}).lean();
        
        console.log(`Found ${allFoods.length} total food items in database`);

        // Filter to unique foods by name (case-insensitive)
        const uniqueFoodsMap = new Map();
        for (const food of allFoods) {
            const foodNameLower = food.name.toLowerCase().trim();
            
            // Keep the first occurrence of each unique name
            if (!uniqueFoodsMap.has(foodNameLower)) {
                uniqueFoodsMap.set(foodNameLower, food);
            }
        }
        
        const foods = Array.from(uniqueFoodsMap.values());
        console.log(`Filtered to ${foods.length} unique foods by name`);
        console.log(`Removed ${allFoods.length - foods.length} duplicate food names\n`);

        // Process in batches of 200 with no delay for maximum speed
        const BATCH_SIZE = 200;
        const DELAY_MS = 0; // No delay - maximum speed!
        let processed = 0;

        for (let i = 0; i < foods.length; i += BATCH_SIZE) {
            const batch = foods.slice(i, i + BATCH_SIZE);
            const vectors = [];

            for (const food of batch) {
                try {
                    // Create rich text representation
                    const foodText = createFoodEmbeddingText(food);
                    
                    // Generate embedding with retry logic
                    let embedding;
                    let retries = 3;
                    while (retries > 0) {
                        try {
                            embedding = await generateEmbedding(foodText);
                            break; // Success, exit retry loop
                        } catch (embeddingError) {
                            retries--;
                            if (retries === 0) throw embeddingError;
                            console.log(`   Retrying ${food.name}... (${retries} attempts left)`);
                            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
                        }
                    }

                    // Prepare metadata (keep all fields as strings for Pinecone)
                    const metadata = {
                        foodId: food._id.toString(),
                        name: food.name,
                        category: food.category || 'General',
                        diet_type: food.diet_type || 'General',
                        calories: (food.macronutrients?.calories_kcal || 0).toString(),
                        protein: (food.macronutrients?.proteins_g || 0).toString(),
                        carbs: (food.macronutrients?.carbohydrates_g || 0).toString(),
                        fat: (food.macronutrients?.fats_g || 0).toString(),
                        fiber: (food.macronutrients?.fiber_g || 0).toString(),
                        rasa: JSON.stringify(food.rasa || []),
                        virya: food.virya || '',
                        vipaka: food.vipaka || '',
                        dosha_effects: JSON.stringify(food.dosha_effects || {}),
                        health_benefits: JSON.stringify(food.health_benefits || []),
                        vitamins: JSON.stringify(food.vitamins || {}),
                        minerals: JSON.stringify(food.minerals || {}),
                        seasonal_availability: JSON.stringify(food.seasonal_availability || [])
                    };

                    vectors.push({
                        id: food._id.toString(),
                        values: embedding,
                        metadata
                    });

                    processed++;
                    if (processed % 100 === 0) {
                        console.log(`✓ Processed ${processed}/${foods.length} foods (${Math.round(processed/foods.length*100)}%)`);
                    }

                } catch (error) {
                    console.error(`✗ Error processing food "${food.name}":`, error.message);
                }
            }

            // Upsert batch to Pinecone
            if (vectors.length > 0) {
                await index.upsert(vectors);
                console.log(`📤 Upserted batch of ${vectors.length} vectors to Pinecone`);
            }

            // No delay between batches for maximum speed
        }

        console.log(`\n✅ Successfully embedded ${processed} unique foods into Pinecone`);
        return { 
            success: true, 
            count: processed,
            uniqueCount: foods.length,
            totalCount: allFoods.length,
            duplicatesRemoved: allFoods.length - foods.length
        };

    } catch (error) {
        console.error('Error embedding foods:', error);
        throw error;
    }
}

// Query relevant foods based on patient context
export async function queryRelevantFoods(patientContext, topK = 200) {
    try {
        const index = await getIndex();

        // Create query text from patient context
        const queryParts = [
            `Patient constitution: ${patientContext.constitution}`,
            `Health condition: ${patientContext.primaryHealthCondition}`,
            `Symptoms: ${patientContext.currentSymptoms}`,
            `Food allergies: ${patientContext.foodAllergies}`,
            `Health goals: ${patientContext.healthGoals?.join(', ') || 'wellness'}`,
            `Bowel movements: ${patientContext.bowel_movements || 'normal'}`
        ];

        const queryText = queryParts.join('. ');
        
        // Generate query embedding
        const queryEmbedding = await generateEmbedding(queryText);

        // Query Pinecone
        const queryResponse = await index.query({
            vector: queryEmbedding,
            topK,
            includeMetadata: true
        });

        // Convert results to food objects
        const foods = queryResponse.matches.map(match => ({
            _id: match.metadata.foodId,
            id: match.metadata.foodId,
            name: match.metadata.name,
            category: match.metadata.category,
            diet_type: match.metadata.diet_type,
            macronutrients: {
                calories_kcal: parseFloat(match.metadata.calories) || 0,
                proteins_g: parseFloat(match.metadata.protein) || 0,
                carbohydrates_g: parseFloat(match.metadata.carbs) || 0,
                fats_g: parseFloat(match.metadata.fat) || 0,
                fiber_g: parseFloat(match.metadata.fiber) || 0
            },
            rasa: JSON.parse(match.metadata.rasa || '[]'),
            virya: match.metadata.virya || '',
            vipaka: match.metadata.vipaka || '',
            dosha_effects: JSON.parse(match.metadata.dosha_effects || '{}'),
            health_benefits: JSON.parse(match.metadata.health_benefits || '[]'),
            vitamins: JSON.parse(match.metadata.vitamins || '{}'),
            minerals: JSON.parse(match.metadata.minerals || '{}'),
            seasonal_availability: JSON.parse(match.metadata.seasonal_availability || '[]'),
            relevance_score: match.score
        }));

        console.log(`Retrieved ${foods.length} relevant foods for patient (constitution: ${patientContext.constitution})`);
        return foods;

    } catch (error) {
        console.error('Error querying foods:', error);
        throw error;
    }
}

// Check if foods are embedded
export async function checkEmbeddingStatus() {
    try {
        const index = await getIndex();
        const stats = await index.describeIndexStats();
        return {
            totalVectors: stats.totalRecordCount || 0,
            dimension: stats.dimension,
            isReady: stats.totalRecordCount > 0
        };
    } catch (error) {
        console.error('Error checking embedding status:', error);
        return { totalVectors: 0, isReady: false };
    }
}

// Delete all embeddings (for reset)
export async function clearEmbeddings() {
    try {
        const index = await getIndex();
        await index.deleteAll();
        console.log('All embeddings cleared');
        return { success: true };
    } catch (error) {
        console.error('Error clearing embeddings:', error);
        throw error;
    }
}

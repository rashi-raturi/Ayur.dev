// ⚡ ULTRA FAST In-Memory Vector Search - Optimized for Speed
// Drop-in replacement for Pinecone, maintains EXACT same functionality

import foodModel from '../models/foodModel.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const DIMENSION = 384;
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/BAAI/bge-small-en-v1.5';
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const VECTOR_CACHE_PATH = './fast_vector_cache.json';

let vectorIndex = null;

// ⚡ Initialize Fast Vector Index
async function initializeFastIndex() {
    try {
        // Check if pre-built cache exists
        if (fs.existsSync(VECTOR_CACHE_PATH)) {
            console.log('⚡ Loading existing vector cache...');
            vectorIndex = JSON.parse(fs.readFileSync(VECTOR_CACHE_PATH, 'utf8'));
            console.log(`✅ Vector cache loaded with ${vectorIndex.vectors.length} foods`);
            return vectorIndex;
        }

        // Build new index if doesn't exist
        console.log('🔨 Building new vector index...');
        await buildFastIndex();
        return vectorIndex;
    } catch (error) {
        console.error('Error initializing vector index:', error);
        throw error;
    }
}

// ⚡ Build Fast Vector Index from MongoDB
async function buildFastIndex() {
    try {
        console.log('📊 Fetching foods from MongoDB...');
        const allFoods = await foodModel.find({}).lean();
        
        // Remove duplicates (same as original logic)
        const uniqueFoodsMap = new Map();
        for (const food of allFoods) {
            const foodNameLower = food.name.toLowerCase().trim();
            if (!uniqueFoodsMap.has(foodNameLower)) {
                uniqueFoodsMap.set(foodNameLower, food);
            }
        }
        
        const uniqueFoods = Array.from(uniqueFoodsMap.values());
        console.log(`Found ${uniqueFoods.length} unique foods`);

        // Create vector index structure
        vectorIndex = {
            vectors: [],
            metadata: []
        };

        console.log('🚀 Generating embeddings and building index...');
        for (let i = 0; i < uniqueFoods.length; i++) {
            const food = uniqueFoods[i];
            
            try {
                // Generate embedding text (same as original)
                const embeddingText = createFoodEmbeddingText(food);
                const embedding = await generateEmbedding(embeddingText);
                
                // Add to index
                vectorIndex.vectors.push(embedding);
                vectorIndex.metadata.push({
                    foodId: food._id.toString(),
                    name: food.name,
                    category: food.category,
                    diet_type: food.diet_type || 'General',
                    calories: food.macronutrients?.calories_kcal || 0,
                    protein: food.macronutrients?.proteins_g || 0,
                    carbs: food.macronutrients?.carbohydrates_g || 0,
                    fat: food.macronutrients?.fats_g || 0,
                    fiber: food.macronutrients?.fiber_g || 0,
                    rasa: JSON.stringify(food.rasa || []),
                    virya: food.virya || '',
                    vipaka: food.vipaka || '',
                    dosha_effects: JSON.stringify(food.dosha_effects || {}),
                    health_benefits: JSON.stringify(food.health_benefits || []),
                    vitamins: JSON.stringify(food.vitamins || {}),
                    minerals: JSON.stringify(food.minerals || {}),
                    seasonal_availability: JSON.stringify(food.seasonal_availability || [])
                });

                if ((i + 1) % 100 === 0) {
                    console.log(`✓ Processed ${i + 1}/${uniqueFoods.length} foods (${Math.round((i + 1)/uniqueFoods.length*100)}%)`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 50));

            } catch (error) {
                console.error(`✗ Error processing food "${food.name}":`, error.message);
            }
        }

        // Save index to disk
        console.log('💾 Saving vector index to disk...');
        fs.writeFileSync(VECTOR_CACHE_PATH, JSON.stringify(vectorIndex, null, 2));
        
        console.log(`✅ Vector index built with ${vectorIndex.vectors.length} foods`);
        
        return { 
            success: true, 
            count: vectorIndex.vectors.length,
            totalCount: allFoods.length
        };

    } catch (error) {
        console.error('Error building vector index:', error);
        throw error;
    }
}

// ⚡ Ultra Fast Cosine Similarity Search
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ⚡ Lightning Fast Query Function (Drop-in replacement for queryRelevantFoods)
export async function queryRelevantFoods(patientContext, topK = 500) {
    try {
        // Initialize index if not done
        if (!vectorIndex) {
            await initializeFastIndex();
        }

        // Create query text (EXACT same logic as original)
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

        // ⚡ ULTRA FAST SIMILARITY SEARCH (optimized in-memory)
        const similarities = [];
        for (let i = 0; i < vectorIndex.vectors.length; i++) {
            const similarity = cosineSimilarity(queryEmbedding, vectorIndex.vectors[i]);
            similarities.push({ index: i, score: similarity });
        }

        // Sort and get top K results
        similarities.sort((a, b) => b.score - a.score);
        const topResults = similarities.slice(0, topK);

        // Convert to same format as original (EXACT same structure)
        const foods = topResults.map(result => {
            const metadata = vectorIndex.metadata[result.index];
            return {
                _id: metadata.foodId,
                id: metadata.foodId,
                name: metadata.name,
                category: metadata.category,
                diet_type: metadata.diet_type,
                macronutrients: {
                    calories_kcal: parseFloat(metadata.calories) || 0,
                    proteins_g: parseFloat(metadata.protein) || 0,
                    carbohydrates_g: parseFloat(metadata.carbs) || 0,
                    fats_g: parseFloat(metadata.fat) || 0,
                    fiber_g: parseFloat(metadata.fiber) || 0
                },
                rasa: JSON.parse(metadata.rasa || '[]'),
                virya: metadata.virya || '',
                vipaka: metadata.vipaka || '',
                dosha_effects: JSON.parse(metadata.dosha_effects || '{}'),
                health_benefits: JSON.parse(metadata.health_benefits || '[]'),
                vitamins: JSON.parse(metadata.vitamins || '{}'),
                minerals: JSON.parse(metadata.minerals || '{}'),
                seasonal_availability: JSON.parse(metadata.seasonal_availability || '[]'),
                relevance_score: result.score
            };
        });

        console.log(`⚡ Retrieved ${foods.length} relevant foods for patient (constitution: ${patientContext.constitution}) in MILLISECONDS!`);
        return foods;

    } catch (error) {
        console.error('Error querying foods with fast search:', error);
        throw error;
    }
}

// ⚡ Same embedding generation as original (no changes)
async function generateEmbedding(text) {
    try {
        const response = await fetch(HUGGINGFACE_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: text,
                options: { wait_for_model: true }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (Array.isArray(result) && result.length === DIMENSION) {
            return result;
        }
        
        if (result.error) {
            throw new Error(`HuggingFace API error: ${result.error}`);
        }
        
        throw new Error(`Unexpected embedding format: ${JSON.stringify(result).substring(0, 200)}`);
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw error;
    }
}

// ⚡ Same food embedding text creation as original (no changes)
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

// ⚡ Build index on demand
export async function embedAllFoods() {
    return await buildFastIndex();
}

// ⚡ Check if index is ready
export async function checkEmbeddingStatus() {
    try {
        if (!vectorIndex) {
            if (fs.existsSync(VECTOR_CACHE_PATH)) {
                await initializeFastIndex();
            } else {
                return { totalVectors: 0, isReady: false };
            }
        }
        
        return {
            totalVectors: vectorIndex.vectors.length,
            dimension: DIMENSION,
            isReady: true,
            engine: 'FastVector' // Indicate we're using fast vector search
        };
    } catch (error) {
        console.error('Error checking vector status:', error);
        return { totalVectors: 0, isReady: false };
    }
}

// ⚡ Clear embeddings (delete cache)
export async function clearEmbeddings() {
    try {
        if (fs.existsSync(VECTOR_CACHE_PATH)) {
            fs.unlinkSync(VECTOR_CACHE_PATH);
        }
        
        vectorIndex = null;
        
        console.log('All vector embeddings cleared');
        return { success: true };
    } catch (error) {
        console.error('Error clearing vector embeddings:', error);
        throw error;
    }
}

console.log('⚡ Fast Vector Service initialized - Lightning fast food search ready!');
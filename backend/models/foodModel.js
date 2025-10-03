import mongoose from 'mongoose';

const foodSchema = new mongoose.Schema({
    food_id: { type: String, required: true },
    name: { type: String, required: true },
    name_hindi: { type: String },
    category: { type: String, required: true },
    serving_size: {
        amount: { type: Number, required: true },
        unit: { type: String, required: true }
    },
    macronutrients: {
        carbohydrates_g: { type: Number, required: true },
        proteins_g: { type: Number, required: true },
        fats_g: { type: Number, required: true },
        fiber_g: { type: Number, required: true },
        water_g: { type: Number },
        calories_kcal: { type: Number, required: true }
    },
    vitamins: {
        vitamin_a_mcg: { type: Number },
        vitamin_b1_mg: { type: Number },
        vitamin_b2_mg: { type: Number },
        vitamin_b3_mg: { type: Number },
        vitamin_b6_mg: { type: Number },
        vitamin_b12_mcg: { type: Number },
        vitamin_c_mg: { type: Number },
        vitamin_d_mcg: { type: Number },
        vitamin_e_mg: { type: Number },
        vitamin_k_mcg: { type: Number },
        folate_mcg: { type: Number }
    },
    minerals: {
        calcium_mg: { type: Number },
        iron_mg: { type: Number },
        magnesium_mg: { type: Number },
        phosphorus_mg: { type: Number },
        potassium_mg: { type: Number },
        sodium_mg: { type: Number },
        zinc_mg: { type: Number },
        copper_mg: { type: Number },
        manganese_mg: { type: Number },
        selenium_mcg: { type: Number }
    },
    other_nutrients: {
        cholesterol_mg: { type: Number },
        phytochemicals: [{ type: String }]
    },
    ayurvedic_properties: {
        rasa: [{ type: String }],
        guna: {
            primary: [{ type: String }],
            secondary: [{ type: String }]
        },
        virya: { type: String },
        vipaka: { type: String },
        karma: {
            physical_actions: [{ type: String }],
            mental_actions: [{ type: String }]
        },
        dosha_effects: {
            pitta: { type: String },
            kapha: { type: String },
            vata: { type: String }
        },
        best_for_doshas: [{ type: String }],
        contraindications: [{ type: String }]
    },
    source: { type: String },
    last_updated: { type: String }
});

// Create indexes for faster searching
foodSchema.index({ name: 'text', name_hindi: 'text' }); // Text search on name fields
foodSchema.index({ category: 1 }); // Single field index on category
foodSchema.index({ 'ayurvedic_properties.best_for_doshas': 1 }); // For dosha-based filtering
foodSchema.index({ food_id: 1 });
foodSchema.index({ name: 1, 'serving_size.unit': 1 }); // Compound index for unique name + serving unit queries 


const foodModel = mongoose.models.fooditems || mongoose.model("fooditems", foodSchema, "fooditems");
//const foodModel = mongoose.models.fooditems || mongoose.model("food", foodSchema, "food");

export default foodModel;

import mongoose from 'mongoose';

// Food item with complete details (not a reference)
const foodItemSchema = new mongoose.Schema({
    food_id: { type: String }, // Original food ID for reference
    name: { type: String, required: true },
    category: { type: String },
    amount: { type: Number, required: true },
    serving_unit: { type: String, required: true, enum: ['g', 'ml', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'bowl'] },
    // Store complete nutrition data
    calculated_nutrition: {
        calories: { type: Number, required: true },
        protein: { type: Number, required: true },
        carbs: { type: Number, required: true },
        fat: { type: Number, required: true },
        fiber: { type: Number, required: true }
    },
    vitamins: {
        vitamin_a: { type: Number },
        vitamin_b1: { type: Number },
        vitamin_b2: { type: Number },
        vitamin_b6: { type: Number },
        vitamin_b12: { type: Number },
        vitamin_c: { type: Number },
        vitamin_d: { type: Number },
        vitamin_e: { type: Number },
        folate: { type: Number }
    },
    minerals: {
        calcium: { type: Number },
        iron: { type: Number },
        magnesium: { type: Number },
        phosphorus: { type: Number },
        potassium: { type: Number },
        sodium: { type: Number },
        zinc: { type: Number }
    }
}, { _id: false });

const mealSchema = new mongoose.Schema({
    Breakfast: [foodItemSchema],
    Lunch: [foodItemSchema],
    Snacks: [foodItemSchema],
    Dinner: [foodItemSchema]
}, { _id: false });

const dietChartSchema = new mongoose.Schema({
    // Reference IDs
    patient_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user',
        required: true,
        index: true
    },
    doctor_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'doctor',
        required: true,
        index: true
    },
    prescription_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Prescription',
        default: null,
        index: true
    },
    
    // Patient Information (minimal data, rest fetched from patient_id reference)
    patient_snapshot: {
        age: { type: Number },
        constitution: { type: String }, // Dosha constitution at time of chart creation
        primary_health_condition: { type: String },
        current_symptoms: { type: String },
        food_allergies: { type: String },
        health_goals: [{ type: String }]
    },
    
    // Custom Nutrition Goals set by the doctor
    custom_nutrition_goals: {
        macronutrients: {
            calories: { type: Number, default: 2000 },
            protein: { type: Number, default: 50 },
            carbs: { type: Number, default: 250 },
            fat: { type: Number, default: 65 },
            fiber: { type: Number, default: 25 }
        },
        vitamins: {
            vitamin_a: { type: Number, default: 700 },
            vitamin_b1: { type: Number, default: 1.1 },
            vitamin_b2: { type: Number, default: 1.1 },
            vitamin_b3: { type: Number, default: 14 },
            vitamin_b6: { type: Number, default: 1.3 },
            vitamin_b12: { type: Number, default: 2.4 },
            vitamin_c: { type: Number, default: 75 },
            vitamin_d: { type: Number, default: 15 },
            vitamin_e: { type: Number, default: 15 },
            vitamin_k: { type: Number, default: 90 },
            folate: { type: Number, default: 400 }
        },
        minerals: {
            calcium: { type: Number, default: 1000 },
            iron: { type: Number, default: 10 },
            magnesium: { type: Number, default: 310 },
            phosphorus: { type: Number, default: 700 },
            potassium: { type: Number, default: 2600 },
            sodium: { type: Number, default: 1500 },
            zinc: { type: Number, default: 8 }
        }
    },
    
    // Weekly Meal Plan
    weekly_meal_plan: {
        Mon: { type: mealSchema, required: true },
        Tue: { type: mealSchema, required: true },
        Wed: { type: mealSchema, required: true },
        Thu: { type: mealSchema, required: true },
        Fri: { type: mealSchema, required: true },
        Sat: { type: mealSchema, required: true },
        Sun: { type: mealSchema, required: true }
    },
    
    // Nutritional Summary
    weekly_nutrition_summary: {
        total_calories: { type: Number },
        total_protein: { type: Number },
        total_carbs: { type: Number },
        total_fat: { type: Number },
        total_fiber: { type: Number },
        daily_average: {
            calories: { type: Number },
            protein: { type: Number },
            carbs: { type: Number },
            fat: { type: Number },
            fiber: { type: Number }
        },
        vitamins: {
            vitamin_a: { type: Number },
            vitamin_b1: { type: Number },
            vitamin_b2: { type: Number },
            vitamin_b6: { type: Number },
            vitamin_b12: { type: Number },
            vitamin_c: { type: Number },
            vitamin_d: { type: Number },
            vitamin_e: { type: Number },
            folate: { type: Number }
        },
        minerals: {
            calcium: { type: Number },
            iron: { type: Number },
            magnesium: { type: Number },
            phosphorus: { type: Number },
            potassium: { type: Number },
            zinc: { type: Number }
        }
    },
    
    // Additional Instructions
    special_instructions: { type: String },
    dietary_restrictions: [{ type: String }],
    
    // Metadata
    status: { 
        type: String, 
        enum: ['active', 'completed', 'discontinued', 'draft'], 
        default: 'active',
        index: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false } // Only track creation time
});

// Indexes for efficient querying
dietChartSchema.index({ patient_id: 1, createdAt: -1 }); // Get latest charts for a patient
dietChartSchema.index({ doctor_id: 1, createdAt: -1 }); // Get latest charts by a doctor
dietChartSchema.index({ prescription_id: 1 }); // Link to prescriptions
dietChartSchema.index({ status: 1, createdAt: -1 }); // Filter by status and date

// Method to calculate weekly nutrition summary
dietChartSchema.methods.calculateNutritionSummary = function() {
    const totals = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    };
    
    // Sum up all meals for all days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const meals = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
    
    days.forEach(day => {
        meals.forEach(meal => {
            if (this.weekly_meal_plan[day] && this.weekly_meal_plan[day][meal]) {
                this.weekly_meal_plan[day][meal].forEach(food => {
                    if (food.calculated_nutrition) {
                        totals.calories += food.calculated_nutrition.calories || 0;
                        totals.protein += food.calculated_nutrition.protein || 0;
                        totals.carbs += food.calculated_nutrition.carbs || 0;
                        totals.fat += food.calculated_nutrition.fat || 0;
                        totals.fiber += food.calculated_nutrition.fiber || 0;
                    }
                });
            }
        });
    });
    
    // Calculate daily averages
    this.weekly_nutrition_summary = {
        total_calories: Math.round(totals.calories),
        total_protein: Math.round(totals.protein),
        total_carbs: Math.round(totals.carbs),
        total_fat: Math.round(totals.fat),
        total_fiber: Math.round(totals.fiber),
        daily_average: {
            calories: Math.round(totals.calories / 7),
            protein: Math.round(totals.protein / 7),
            carbs: Math.round(totals.carbs / 7),
            fat: Math.round(totals.fat / 7),
            fiber: Math.round(totals.fiber / 7)
        }
    };
};

// Static method to get active charts for a patient
dietChartSchema.statics.getActiveChartsForPatient = function(patientId) {
    return this.find({ 
        patient_id: patientId, 
        status: 'active' 
    }).sort({ createdAt: -1 });
};

// Static method to get charts by doctor
dietChartSchema.statics.getChartsByDoctor = function(doctorId, limit = 10) {
    return this.find({ doctor_id: doctorId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('patient_id', 'name email phone age gender')
        .populate('prescription_id')
        .populate('weekly_meal_plan.Mon.Breakfast.food_ref')
        .populate('weekly_meal_plan.Mon.Lunch.food_ref')
        .populate('weekly_meal_plan.Mon.Snacks.food_ref')
        .populate('weekly_meal_plan.Mon.Dinner.food_ref')
        .populate('weekly_meal_plan.Tue.Breakfast.food_ref')
        .populate('weekly_meal_plan.Tue.Lunch.food_ref')
        .populate('weekly_meal_plan.Tue.Snacks.food_ref')
        .populate('weekly_meal_plan.Tue.Dinner.food_ref')
        .populate('weekly_meal_plan.Wed.Breakfast.food_ref')
        .populate('weekly_meal_plan.Wed.Lunch.food_ref')
        .populate('weekly_meal_plan.Wed.Snacks.food_ref')
        .populate('weekly_meal_plan.Wed.Dinner.food_ref')
        .populate('weekly_meal_plan.Thu.Breakfast.food_ref')
        .populate('weekly_meal_plan.Thu.Lunch.food_ref')
        .populate('weekly_meal_plan.Thu.Snacks.food_ref')
        .populate('weekly_meal_plan.Thu.Dinner.food_ref')
        .populate('weekly_meal_plan.Fri.Breakfast.food_ref')
        .populate('weekly_meal_plan.Fri.Lunch.food_ref')
        .populate('weekly_meal_plan.Fri.Snacks.food_ref')
        .populate('weekly_meal_plan.Fri.Dinner.food_ref')
        .populate('weekly_meal_plan.Sat.Breakfast.food_ref')
        .populate('weekly_meal_plan.Sat.Lunch.food_ref')
        .populate('weekly_meal_plan.Sat.Snacks.food_ref')
        .populate('weekly_meal_plan.Sat.Dinner.food_ref')
        .populate('weekly_meal_plan.Sun.Breakfast.food_ref')
        .populate('weekly_meal_plan.Sun.Lunch.food_ref')
        .populate('weekly_meal_plan.Sun.Snacks.food_ref')
        .populate('weekly_meal_plan.Sun.Dinner.food_ref');
};

const dietChartModel = mongoose.models.dietChart || mongoose.model("dietChart", dietChartSchema);

export default dietChartModel;

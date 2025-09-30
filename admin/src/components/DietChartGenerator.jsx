import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChefHat, Download, User, Utensils, Heart, Target, RefreshCw, FileText } from "lucide-react";
import jsPDF from 'jspdf';

export default function DietChartGenerator() {
  const [formData, setFormData] = useState({
    patientName: "",
    age: "",
    gender: "",
    
    primaryConstitution: "",
    lifestyle: "",
    
    primaryCondition: "",
    currentSymptoms: "",
    foodAllergies: "",
    
    healthGoals: []
  });

  const [generatedDietChart, setGeneratedDietChart] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Save generated charts to localStorage
  const saveChartToHistory = (chartData) => {
    const existingCharts = JSON.parse(localStorage.getItem('dietCharts') || '[]');
    const newChart = {
      id: Date.now(),
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      constitution: formData.primaryConstitution,
      generatedDate: new Date().toISOString(),
      chartContent: chartData,
      formData: { ...formData }
    };
    
    existingCharts.unshift(newChart); // Add to beginning
    localStorage.setItem('dietCharts', JSON.stringify(existingCharts));
  };

  // Constitution options
  const constitutions = [
    { value: "vata", label: "Vata (Air & Space)" },
    { value: "pitta", label: "Pitta (Fire & Water)" },
    { value: "kapha", label: "Kapha (Earth & Water)" },
    { value: "vata-pitta", label: "Vata-Pitta" },
    { value: "pitta-kapha", label: "Pitta-Kapha" },
    { value: "vata-kapha", label: "Vata-Kapha" },
    { value: "tridoshic", label: "Tridoshic (Balanced)" }
  ];

  // Lifestyle options
  const lifestyles = [
    { value: "sedentary", label: "Sedentary (Office work, minimal exercise)" },
    { value: "lightly-active", label: "Lightly Active (Light exercise 1-3 days/week)" },
    { value: "moderately-active", label: "Moderately Active (Moderate exercise 3-5 days/week)" },
    { value: "very-active", label: "Very Active (Heavy exercise 6-7 days/week)" },
    { value: "extremely-active", label: "Extremely Active (Physical job + exercise)" }
  ];

  // Health goals options
  const healthGoalOptions = [
    { id: "weight-management", label: "Weight Management" },
    { id: "improve-digestion", label: "Improve Digestion" },
    { id: "reduce-inflammation", label: "Reduce Inflammation" },
    { id: "boost-energy", label: "Boost Energy" },
    { id: "better-sleep", label: "Better Sleep" },
    { id: "stress-reduction", label: "Stress Reduction" },
    { id: "detoxification", label: "Detoxification" },
    { id: "immune-support", label: "Immune Support" }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHealthGoalChange = (goalId) => {
    setFormData(prev => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goalId)
        ? prev.healthGoals.filter(id => id !== goalId)
        : [...prev.healthGoals, goalId]
    }));
  };

  const generateDietChart = async () => {
    // Validate required fields
    if (!formData.patientName || !formData.age || !formData.gender || !formData.primaryConstitution) {
      alert("Please fill in all required patient information fields.");
      return;
    }

    setLoading(true);
    
    try {
      // For now, we'll create a comprehensive sample response
      // In production, this would call your AI service
      const sampleDietChart = generateSampleDietChart(formData);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratedDietChart(sampleDietChart);
      saveChartToHistory(sampleDietChart);
      setShowForm(false); // Hide form after generating chart
    } catch (error) {
      console.error("Error generating diet chart:", error);
      alert("Failed to generate diet chart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateSampleDietChart = (data) => {
    const constitutionInfo = constitutions.find(c => c.value === data.primaryConstitution)?.label || data.primaryConstitution;
    
    return {
      dietPlan: `# 🍽️ Daily Meal Plan

## 🌅 **Breakfast (6:00-8:00 AM)**
${data.primaryConstitution === 'vata' ? `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Warm Spiced Oatmeal | 1 bowl | Grounding and nourishing |
| Ghee | 1 tsp | Improves digestion |
| Cinnamon | Pinch | Warming spice |
| Chopped Dates | 2-3 pieces | Natural sweetness |
| Golden Milk | 1 cup | Calming and anti-inflammatory |
| Fresh Banana | 1 medium | Sweet fruit for Vata |
` : data.primaryConstitution === 'pitta' ? `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Cooling Smoothie | 1 glass | Reduces body heat |
| Coconut Milk | 1 cup | Cooling and hydrating |
| Sweet Fruits | 1 cup | Natural cooling effect |
| Mint Leaves | 5-6 leaves | Refreshing and cooling |
| Whole Grain Toast | 2 slices | Sustaining energy |
| Avocado | 1/2 piece | Healthy fats |
| Cucumber | Few slices | Cooling vegetable |
` : `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Fresh Fruit Salad | 1 bowl | Light and energizing |
| Ginger | Small piece | Stimulates digestion |
| Honey | 1 tsp | Natural sweetener |
| Ginger-Turmeric Tea | 1 cup | Boosts metabolism |
| Whole Grain Cereal | Small portion | Light breakfast option |
`}

## 🌞 **Lunch (12:00-1:00 PM)**
${data.primaryConstitution === 'vata' ? `
| Meal Component | Item | Quantity | Benefits |
|----------------|------|----------|----------|
| Main Course | Kitchari (Rice & Lentils) | 1 bowl | Complete protein, easy to digest |
| Fat | Ghee | 1 tbsp | Improves nutrient absorption |
| Vegetables | Steamed Root Vegetables | 1 cup | Grounding and warming |
| Spices | Cumin, Coriander, Ginger | As needed | Aids digestion |
| Soup | Warm Vegetable Soup | 1 bowl | Hydrating and nourishing |
| Drink | Room Temperature Water | 1-2 glasses | Maintains hydration |
` : data.primaryConstitution === 'pitta' ? `
| Meal Component | Item | Quantity | Benefits |
|----------------|------|----------|----------|
| Main Course | Basmati Rice | 1 cup | Cooling grain |
| Vegetables | Cooling Vegetables Mix | 1 cup | Reduces internal heat |
| Salad | Fresh Greens with Cucumber | 1 bowl | Cooling and hydrating |
| Protein | Mung Dal | 1/2 cup | Easy to digest protein |
| Garnish | Fresh Coconut | 2 tbsp | Cooling fat |
| Drink | Cool Water/Coconut Water | 1-2 glasses | Maintains cool temperature |
` : `
| Meal Component | Item | Quantity | Benefits |
|----------------|------|----------|----------|
| Main Course | Quinoa with Spiced Vegetables | 1 bowl | Light and nutritious |
| Protein | Light Legumes | 1/2 cup | Protein without heaviness |
| Vegetables | Leafy Greens Stir-fry | 1 cup | Stimulates metabolism |
| Spices | Ginger, Black Pepper | As needed | Increases digestive fire |
| Soup | Clear Spiced Broth | 1 bowl | Warm and light |
| Drink | Warm Water with Lemon | 1-2 glasses | Aids digestion |
`}

## 🌙 **Dinner (6:00-7:00 PM)**
${data.primaryConstitution === 'vata' ? `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Light Vegetable Soup | 1 bowl | Easy evening digestion |
| Whole Grain Bread | 1-2 slices | Satisfying carbohydrates |
| Sautéed Seasonal Vegetables | 1 cup | Warm and grounding |
| Herbal Tea (Chamomile/Ginger) | 1 cup | Calming before sleep |
` : data.primaryConstitution === 'pitta' ? `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Light Vegetable Curry | 1 bowl | Cooling and mild |
| Steamed Rice | 1/2 cup | Easy to digest |
| Steamed Greens with Coconut | 1 cup | Cooling vegetables |
| Cool Herbal Tea (Mint/Rose) | 1 cup | Cooling evening drink |
` : `
| Meal Item | Quantity | Benefits |
|-----------|----------|----------|
| Spiced Vegetable Stir-fry | 1 bowl | Light but stimulating |
| Small Portion Whole Grains | 1/2 cup | Satisfying but not heavy |
| Warm Ginger Tea | 1 cup | Aids digestion |
`}

## 🥜 **Healthy Snacks (Optional)**
| Time | Snack Option | Quantity | Benefits |
|------|--------------|----------|----------|
| Mid-Morning | Soaked Almonds | 5-6 pieces | Healthy fats and protein |
| Afternoon | Herbal Tea + Light Snack | 1 cup + small portion | Maintains energy |
| Evening | Warm Milk with Turmeric | 1 cup | Calming before bed |

---

## 📊 **Weekly Meal Rotation**

### **Breakfast Alternatives**
| Day | Option 1 | Option 2 | Option 3 |
|-----|----------|----------|----------|
| Mon-Wed | Oatmeal with fruits | Smoothie bowl | Whole grain toast |
| Thu-Fri | Traditional porridge | Fresh fruit bowl | Herbal tea with light meal |
| Sat-Sun | Special constitution-based meal | Seasonal fruits | Light and nourishing option |

### **Lunch Variations**
| Day | Main Course | Side Dish | Beverage |
|-----|-------------|-----------|-----------|
| Mon-Wed | Kitchari/Rice bowl | Steamed vegetables | Herbal tea |
| Thu-Fri | Quinoa/Millet dish | Fresh salad | Infused water |
| Sat-Sun | Traditional meal | Seasonal vegetables | Constitution-specific drink |

### **Dinner Options**
| Day | Light Option | Moderate Option | Liquid Option |
|-----|--------------|-----------------|---------------|
| Mon-Wed | Vegetable soup | Light curry | Warm herbal tea |
| Thu-Fri | Steamed vegetables | Small grain portion | Golden milk |
| Sat-Sun | Seasonal vegetables | Traditional light meal | Calming bedtime drink |`,

      guidelines: `# 📋 Ayurvedic Eating Guidelines & Recommendations

## 🧘‍♀️ **Constitutional Analysis**
Your primary constitution is **${constitutionInfo}**. This means your body has specific dietary needs to maintain balance and optimal health.

${data.primaryConstitution === 'vata' ? `
### **Vata Constitution Guidelines**
- **Characteristics:** Creative, energetic, quick-thinking
- **When Imbalanced:** Irregular digestion, anxiety, restlessness
- **Dietary Focus:** Warm, moist, grounding foods that calm the nervous system
- **Best Times to Eat:** Regular meal times, never skip meals
- **Cooking Methods:** Steaming, sautéing, slow cooking
` : data.primaryConstitution === 'pitta' ? `
### **Pitta Constitution Guidelines**
- **Characteristics:** Focused, ambitious, strong digestion
- **When Imbalanced:** Irritability, inflammation, excessive heat
- **Dietary Focus:** Cool, mild, slightly sweet foods that reduce heat
- **Best Times to Eat:** Don't skip meals, avoid eating when angry
- **Cooking Methods:** Steaming, boiling, raw foods in moderation
` : data.primaryConstitution === 'kapha' ? `
### **Kapha Constitution Guidelines**
- **Characteristics:** Calm, stable, strong immunity
- **When Imbalanced:** Sluggishness, weight gain, congestion
- **Dietary Focus:** Light, warm, spicy foods that stimulate metabolism
- **Best Times to Eat:** Smaller portions, light dinner
- **Cooking Methods:** Grilling, roasting, stir-frying
` : `
### **Mixed Constitution Guidelines**
- **Characteristics:** Balanced combination of doshas
- **Approach:** Monitor which dosha is currently predominant
- **Dietary Focus:** Seasonal adjustments and mindful eating
- **Flexibility:** Adapt based on current imbalances
`}

---

## ✅ **Foods to Favor**
${data.primaryConstitution === 'vata' ? `
### **Grains & Cereals**
- ✓ Rice (especially basmati)
- ✓ Oats (cooked)
- ✓ Wheat
- ✓ Quinoa (in moderation)

### **Vegetables**
- ✓ Root vegetables (carrots, beets, sweet potatoes)
- ✓ Cooked leafy greens
- ✓ Squash and pumpkin
- ✓ Asparagus and artichokes

### **Fruits**
- ✓ Sweet fruits (bananas, mangoes, grapes)
- ✓ Cooked apples and pears
- ✓ Avocados
- ✓ Fresh figs and dates

### **Proteins**
- ✓ Mung beans and lentils
- ✓ Tofu and tempeh
- ✓ Fresh dairy (in moderation)
- ✓ Nuts and seeds (soaked)

### **Spices & Herbs**
- ✓ Ginger, cinnamon, cardamom
- ✓ Fennel, cumin, coriander
- ✓ Turmeric, fenugreek
- ✓ Fresh herbs (basil, cilantro)

### **Oils & Fats**
- ✓ Ghee (clarified butter)
- ✓ Sesame oil
- ✓ Olive oil
- ✓ Coconut oil
` : data.primaryConstitution === 'pitta' ? `
### **Grains & Cereals**
- ✓ Basmati rice
- ✓ Barley
- ✓ Oats
- ✓ Wheat

### **Vegetables**
- ✓ Leafy greens (kale, spinach, lettuce)
- ✓ Cucumber, zucchini
- ✓ Sweet potatoes
- ✓ Broccoli and cauliflower

### **Fruits**
- ✓ Sweet fruits (melons, pears, grapes)
- ✓ Coconut
- ✓ Sweet apples
- ✓ Pomegranates

### **Proteins**
- ✓ Mung beans
- ✓ Chickpeas
- ✓ Fresh dairy
- ✓ Sunflower and pumpkin seeds

### **Spices & Herbs**
- ✓ Coriander, fennel, mint
- ✓ Cardamom, cinnamon
- ✓ Fresh herbs (cilantro, parsley)
- ✓ Turmeric (cooling preparation)

### **Oils & Fats**
- ✓ Ghee (in moderation)
- ✓ Coconut oil
- ✓ Sunflower oil
- ✓ Olive oil
` : `
### **Grains & Cereals**
- ✓ Quinoa, millet
- ✓ Buckwheat
- ✓ Barley
- ✓ Amaranth

### **Vegetables**
- ✓ Leafy greens (all types)
- ✓ Broccoli, cabbage
- ✓ Peppers, radishes
- ✓ Sprouts and microgreens

### **Fruits**
- ✓ Apples, pears
- ✓ Berries (all types)
- ✓ Pomegranates
- ✓ Cranberries

### **Proteins**
- ✓ Lentils (red, green)
- ✓ Chickpeas and black beans
- ✓ Small amounts of lean protein
- ✓ Sunflower seeds

### **Spices & Herbs**
- ✓ Ginger, black pepper
- ✓ Turmeric, mustard seeds
- ✓ Cayenne, chili
- ✓ Fresh herbs (all types)

### **Oils & Fats**
- ✓ Mustard oil
- ✓ Sunflower oil
- ✓ Small amounts of ghee
- ✓ Flaxseed oil
`}

---

## ❌ **Foods to Minimize or Avoid**
${data.primaryConstitution === 'vata' ? `
### **Avoid These Foods**
- ❌ Cold, dry, or raw foods in excess
- ❌ Processed and packaged foods
- ❌ Excessive caffeine and stimulants
- ❌ Bitter and astringent vegetables (raw kale, raw broccoli)
- ❌ Ice-cold drinks and foods
- ❌ Irregular meal timing
- ❌ Skipping meals
- ❌ Eating while stressed or distracted
` : data.primaryConstitution === 'pitta' ? `
### **Avoid These Foods**
- ❌ Spicy, sour, or overly salty foods
- ❌ Fried and oily foods
- ❌ Alcohol and excessive caffeine
- ❌ Citrus fruits and tomatoes (in excess)
- ❌ Vinegar and fermented foods
- ❌ Red meat and heavy proteins
- ❌ Eating when angry or stressed
- ❌ Skipping meals (especially lunch)
` : `
### **Avoid These Foods**
- ❌ Heavy, oily, or fried foods
- ❌ Excessive dairy and sweets
- ❌ Cold drinks and ice cream
- ❌ Processed and canned foods
- ❌ Heavy grains (excessive wheat)
- ❌ Overeating and late meals
- ❌ Sedentary lifestyle
- ❌ Sleeping after meals
`}

---

## 🕐 **Ayurvedic Eating Principles**

### **Meal Timing Guidelines**
| Meal | Optimal Time | Portion Size | Digestive Fire |
|------|-------------|--------------|----------------|
| Breakfast | 6:00-8:00 AM | Light to Moderate | Building |
| Lunch | 12:00-1:00 PM | Largest Meal | Strongest |
| Dinner | 6:00-7:00 PM | Light | Diminishing |

### **General Eating Rules**
1. **Eat Mindfully** - No distractions, focus on food
2. **Chew Thoroughly** - Aids digestion and satisfaction
3. **Eat to 75% Capacity** - Leave space for digestion
4. **Maintain Regular Timing** - Supports digestive rhythm
5. **Eat Fresh Food** - Avoid reheated or stale food
6. **Drink Warm Water** - Room temperature or warm
7. **Don't Drink with Meals** - Small sips only if needed
8. **Rest After Eating** - 5-10 minutes of calm sitting

### **Food Combining Guidelines**
| Good Combinations | Poor Combinations |
|-------------------|-------------------|
| Rice + Lentils | Milk + Citrus |
| Vegetables + Grains | Honey + Hot Foods |
| Fruits (eaten alone) | Fruit + Other Foods |
| Ghee + Warm Foods | Cold + Hot Foods |

---

## 🌿 **Herbal Support & Supplements**

### **Daily Herbs & Spices**
${data.primaryConstitution === 'vata' ? `
| Herb/Spice | Benefits | How to Use |
|------------|----------|------------|
| Ginger | Improves digestion, warming | Fresh ginger tea, cooking |
| Cinnamon | Stabilizing, warming | Sprinkle on food, tea |
| Ashwagandha | Calms nervous system | Evening tea or supplement |
| Turmeric | Anti-inflammatory | Golden milk, cooking |
| Fennel | Digestive aid | Post-meal tea |
` : data.primaryConstitution === 'pitta' ? `
| Herb/Spice | Benefits | How to Use |
|------------|----------|------------|
| Coriander | Cooling, digestive | Coriander water, cooking |
| Fennel | Soothing, cooling | Fennel tea after meals |
| Mint | Cooling, refreshing | Fresh tea, garnish |
| Aloe Vera | Cooling, healing | Fresh juice (small amounts) |
| Cardamom | Cooling, aromatic | Tea, desserts |
` : `
| Herb/Spice | Benefits | How to Use |
|------------|----------|------------|
| Ginger | Stimulates metabolism | Fresh ginger tea, cooking |
| Turmeric | Anti-inflammatory | Golden milk, cooking |
| Black Pepper | Increases digestive fire | Cooking, tea blends |
| Mustard Seeds | Stimulating, warming | Cooking, tempering |
| Fenugreek | Supports metabolism | Soaked seeds, cooking |
`}

### **Herbal Tea Blends**
- **Morning Blend**: Constitution-specific warming or cooling herbs
- **Digestive Blend**: Fennel, coriander, cumin (CCF tea)
- **Evening Blend**: Calming herbs like chamomile or tulsi

---

## 🌱 **Lifestyle Integration**

${formData.healthGoals.includes('weight-management') ? `
### 🎯 **Weight Management Support**
- Eat largest meal at midday when digestive fire is strongest
- Include metabolism-boosting spices daily
- Practice mindful portion control
- Stay hydrated with warm water throughout day
- Avoid late-night eating
- Include gentle exercise after meals
` : ''}

${formData.healthGoals.includes('improve-digestion') ? `
### 🎯 **Digestive Health Optimization**
- Start meals with fresh ginger or digestive tea
- Avoid cold beverages during meals
- Take short walks after eating
- Practice deep breathing before meals
- Eat in calm, peaceful environment
- Maintain regular meal schedule
` : ''}

${formData.healthGoals.includes('stress-reduction') ? `
### 🎯 **Stress Reduction Through Diet**
- Practice mindful, meditative eating
- Include calming herbs like chamomile and tulsi
- Maintain consistent meal times
- Create peaceful eating environment
- Avoid eating when emotionally disturbed
- Use food as medicine and nourishment
` : ''}

### **Daily Routine Integration**
1. **Wake Up**: Warm water with lemon
2. **Morning**: Light exercise or yoga
3. **Breakfast**: Constitution-appropriate meal
4. **Mid-Morning**: Herbal tea if needed
5. **Lunch**: Main meal of the day
6. **Afternoon**: Light snack if needed
7. **Dinner**: Light, early meal
8. **Evening**: Herbal tea and relaxation

---

## 📅 **Seasonal Adjustments**

### **Spring (March-May)**
- **Focus**: Cleansing and detoxification
- **Foods**: Light, bitter, astringent tastes
- **Reduce**: Heavy, oily, sweet foods

### **Summer (June-August)**
- **Focus**: Cooling and hydrating
- **Foods**: Sweet, cooling, hydrating foods
- **Reduce**: Spicy, heating, heavy foods

### **Fall (September-November)**
- **Focus**: Grounding and nourishing
- **Foods**: Warm, moist, grounding foods
- **Reduce**: Dry, cold, light foods

### **Winter (December-February)**
- **Focus**: Warming and strengthening
- **Foods**: Warm, heavy, nourishing foods
- **Reduce**: Cold, light, dry foods

---

## ⚠️ **Important Disclaimers**

- This diet chart is based on traditional Ayurvedic principles
- Individual responses may vary significantly
- Adjust portions and foods based on your body's response
- Consult qualified Ayurvedic practitioners for personalized guidance
- Those with medical conditions should consult healthcare providers
- Start dietary changes gradually and mindfully
- Listen to your body and make adjustments as needed

---

*Generated on ${new Date().toLocaleDateString()} | Ayurveda Healthcare System*
*This guidance is for educational purposes only and should not replace professional medical advice.*`
    };
  };

  const handleDownloadPdf = async () => {
    if (!generatedDietChart) return;
    
    setDownloadingPdf(true);
    try {
      // Create PDF instance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 6;
      let yPosition = margin;

      // Helper function to add text with word wrapping
      const addText = (text, x, y, maxWidth, fontSize = 10, fontStyle = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        const lines = pdf.splitTextToSize(text, maxWidth);
        
        for (let i = 0; i < lines.length; i++) {
          if (y + (i * lineHeight) > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(lines[i], x, y + (i * lineHeight));
        }
        return y + (lines.length * lineHeight);
      };

      // Add header with styling
      pdf.setFillColor(52, 152, 219); // Blue background
      pdf.rect(0, 0, pageWidth, 40, 'F');
      
      pdf.setTextColor(255, 255, 255); // White text
      yPosition = addText('🌿 AYURVEDIC DIET CHART', margin, 15, pageWidth - 2 * margin, 18, 'bold');
      yPosition = addText('Personalized Nutritional Guidance', margin, 25, pageWidth - 2 * margin, 12);
      
      pdf.setTextColor(0, 0, 0); // Reset to black
      yPosition = 50;

      // Patient Information Header
      yPosition = addText(`Patient: ${formData.patientName} | Age: ${formData.age} | Gender: ${formData.gender}`, margin, yPosition, pageWidth - 2 * margin, 12, 'bold');
      yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition + 5, pageWidth - 2 * margin, 10, 'italic');
      yPosition += 15;

      // Process diet plan content
      const processPdfContent = (content, title) => {
        // Add section title
        yPosition += 5;
        yPosition = addText(title, margin, yPosition, pageWidth - 2 * margin, 16, 'bold');
        yPosition += 5;
        
        const lines = content.split('\n');
        
        for (let line of lines) {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;
          }

          line = line.trim();
          if (!line) {
            yPosition += 3;
            continue;
          }

          // Handle different markdown elements
          if (line.startsWith('# ')) {
            yPosition += 5;
            yPosition = addText(line.replace('# ', ''), margin, yPosition, pageWidth - 2 * margin, 16, 'bold');
            yPosition += 5;
          } else if (line.startsWith('## ')) {
            yPosition += 3;
            yPosition = addText(line.replace('## ', ''), margin, yPosition, pageWidth - 2 * margin, 14, 'bold');
            yPosition += 3;
          } else if (line.startsWith('### ')) {
            yPosition += 2;
            yPosition = addText(line.replace('### ', ''), margin, yPosition, pageWidth - 2 * margin, 12, 'bold');
            yPosition += 2;
          } else if (line.startsWith('**') && line.endsWith('**')) {
            yPosition = addText(line.replace(/\*\*/g, ''), margin, yPosition, pageWidth - 2 * margin, 11, 'bold');
          } else if (line.startsWith('- ') || line.startsWith('• ')) {
            yPosition = addText(line, margin + 5, yPosition, pageWidth - 2 * margin - 5, 10);
          } else if (line.startsWith('|') && !line.includes('---')) {
            // Handle table rows - simplified for PDF
            const cells = line.split('|').filter(cell => cell.trim());
            if (cells.length > 0) {
              yPosition = addText(cells.join(' | '), margin + 5, yPosition, pageWidth - 2 * margin - 5, 9);
            }
          } else if (line.startsWith('---')) {
            yPosition += 3;
          } else {
            yPosition = addText(line.replace(/\*\*/g, '').replace(/\*/g, ''), margin, yPosition, pageWidth - 2 * margin, 10);
          }
          yPosition += 2;
        }
      };

      // Add diet plan section
      processPdfContent(generatedDietChart.dietPlan, 'DAILY DIET PLAN');
      
      // Add new page for guidelines
      pdf.addPage();
      yPosition = margin;
      
      // Add guidelines section
      processPdfContent(generatedDietChart.guidelines, 'GUIDELINES & RECOMMENDATIONS');

      // Add footer to all pages
      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        const footerY = pageHeight - 15;
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Generated by Ayurveda Healthcare System - Page ${i} of ${totalPages} - For educational purposes only. Consult healthcare professionals for medical advice.`, margin, footerY, { maxWidth: pageWidth - 2 * margin });
      }

      // Save the PDF
      const fileName = `ayurvedic-diet-chart-${formData.patientName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleGenerateAgain = () => {
    setGeneratedDietChart("");
    setShowForm(true);
  };

  return (
    <div className="bg-yellow-100 w-full min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Diet Chart Generator</h1>
          </div>
          <p className="text-gray-600">Create personalized Ayurvedic meal plans</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Form Section */}
          <div className={`bg-white rounded-lg shadow-lg p-6 ${generatedDietChart ? 'lg:col-span-1' : 'lg:col-span-2 max-w-4xl mx-auto'}`}>
            
            {/* Patient Information */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Patient Information</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    placeholder="Enter patient name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    placeholder="Age"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Ayurvedic Assessment */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Utensils className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Ayurvedic Assessment</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Constitution *</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.primaryConstitution}
                    onChange={(e) => handleInputChange('primaryConstitution', e.target.value)}
                  >
                    <option value="">Select constitution</option>
                    {constitutions.map(constitution => (
                      <option key={constitution.value} value={constitution.value}>
                        {constitution.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lifestyle</label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.lifestyle}
                    onChange={(e) => handleInputChange('lifestyle', e.target.value)}
                  >
                    <option value="">Select lifestyle</option>
                    {lifestyles.map(lifestyle => (
                      <option key={lifestyle.value} value={lifestyle.value}>
                        {lifestyle.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Health Information */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Heart className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Health Information</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Primary Condition/Concern</label>
                  <input
                    type="text"
                    placeholder="e.g., Digestive issues, Weight management, Stress"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.primaryCondition}
                    onChange={(e) => handleInputChange('primaryCondition', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Symptoms</label>
                  <textarea
                    placeholder="Describe current symptoms or imbalances"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows="3"
                    value={formData.currentSymptoms}
                    onChange={(e) => handleInputChange('currentSymptoms', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies/Restrictions</label>
                  <input
                    type="text"
                    placeholder="Any foods to avoid"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.foodAllergies}
                    onChange={(e) => handleInputChange('foodAllergies', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Health Goals */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <Target className="w-5 h-5 text-primary mr-2" />
                <h2 className="text-xl font-semibold text-gray-800">Health Goals</h2>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {healthGoalOptions.map(goal => (
                  <label key={goal.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      checked={formData.healthGoals.includes(goal.id)}
                      onChange={() => handleHealthGoalChange(goal.id)}
                    />
                    <span className="text-sm text-gray-700">{goal.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateDietChart}
              disabled={loading || !formData.patientName || !formData.age || !formData.gender || !formData.primaryConstitution}
              className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                loading || !formData.patientName || !formData.age || !formData.gender || !formData.primaryConstitution
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating Diet Chart...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Utensils className="w-5 h-5" />
                  <span>Generate Diet Chart</span>
                </div>
              )}
            </button>
          </div>

          {/* Generated Diet Chart Section - Enhanced UI */}
          {generatedDietChart && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Chart Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Ayurvedic Diet Chart</h2>
                      <p className="text-green-100 text-sm">For {formData.patientName}</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 disabled:opacity-50 transition-all backdrop-blur-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>{downloadingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                    </button>
                    
                    <button
                      onClick={handleGenerateAgain}
                      className="flex items-center space-x-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all backdrop-blur-sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate Again</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Chart Content */}
              <div className="p-6">
                {/* Patient Summary Card */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Patient Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-600 font-medium">Name:</span>
                      <p className="text-blue-800">{formData.patientName}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Age:</span>
                      <p className="text-blue-800">{formData.age} years</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Gender:</span>
                      <p className="text-blue-800 capitalize">{formData.gender}</p>
                    </div>
                    <div>
                      <span className="text-blue-600 font-medium">Constitution:</span>
                      <p className="text-blue-800">{constitutions.find(c => c.value === formData.primaryConstitution)?.label}</p>
                    </div>
                  </div>
                  
                  {formData.healthGoals.length > 0 && (
                    <div className="mt-3">
                      <span className="text-blue-600 font-medium text-sm">Health Goals:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {formData.healthGoals.map(goalId => (
                          <span key={goalId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {healthGoalOptions.find(opt => opt.id === goalId)?.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Generated Chart Content */}
                <div className="space-y-6">
                  {/* Diet Plan Section */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">🍽️</span>
                      </div>
                      <h3 className="text-xl font-bold text-green-800">Daily Diet Plan</h3>
                    </div>
                    <div className="prose prose-green max-w-none prose-headings:text-green-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-green-700 max-h-[400px] overflow-y-auto">
                      <ReactMarkdown>{generatedDietChart.dietPlan}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Guidelines Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xl">📋</span>
                      </div>
                      <h3 className="text-xl font-bold text-blue-800">Guidelines & Recommendations</h3>
                    </div>
                    <div className="prose prose-blue max-w-none prose-headings:text-blue-800 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-blue-700 max-h-[400px] overflow-y-auto">
                      <ReactMarkdown>{generatedDietChart.guidelines}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {/* Action Buttons at Bottom */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>{downloadingPdf ? 'Generating...' : 'Download PDF'}</span>
                    </button>
                    
                    <button
                      onClick={handleGenerateAgain}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Generate Again</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State when no chart is generated */}
          {!generatedDietChart && (
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-1">
              <div className="text-center py-12 text-gray-500">
                <Utensils className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No diet chart generated yet</p>
                <p className="text-sm">Fill out the form and click &quot;Generate Diet Chart&quot; to create a personalized Ayurvedic meal plan.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

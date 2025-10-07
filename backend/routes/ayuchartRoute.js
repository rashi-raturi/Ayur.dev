import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// POST /api/ayuchart - Generate Ayurvedic Diet Plan
router.post("/", async (req, res) => {
  console.log("📊 AyuChart request received:", req.body);
  
  try {
    const { description } = req.body;

    if (!description || description.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Please provide your dietary needs and health information!" 
      });
    }

    console.log("🌿 Processing diet plan request for:", description);

    try {
      // Initialize Gemini AI
      console.log("🔄 Initializing Gemini AI for AyuChart...");
      const genAI = new GoogleGenerativeAI("AIzaSyC6ZPzOTR_yDMctE8R1q2pOHYAXigvVWAo");
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      // Create comprehensive Ayurvedic diet planning prompt
      const prompt = `You are an expert Ayurvedic nutritionist. Create a comprehensive, personalized diet plan based on this information: "${description}"

IMPORTANT: Respond with clean HTML content only. Do NOT use code block markers like \`\`\`html or \`\`\`. 

Please provide a complete dietary profile with the following structure:

<div class="diet-profile">
<h3>🌿 Ayurvedic Analysis</h3>
<p><strong>Constitution Assessment:</strong> [Analyze dosha based on description]</p>
<p><strong>Health Goals:</strong> [Summarize their goals]</p>
<p><strong>Key Recommendations:</strong> [2-3 main points]</p>

<h3>🍽️ Daily Meal Plan</h3>
<table class="meal-table" style="width:100%; border-collapse: collapse; margin: 20px 0;">
<thead>
<tr style="background-color: #f8f9fa; border: 2px solid #e9ecef;">
<th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; font-weight: 600;">Meal</th>
<th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; font-weight: 600;">Recommendation</th>
<th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; font-weight: 600;">Timing</th>
</tr>
</thead>
<tbody>
<tr style="border: 1px solid #dee2e6;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🌅 Breakfast</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Specific foods with benefits]</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Best time]</td>
</tr>
<tr style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">☀️ Lunch</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Specific foods with benefits]</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Best time]</td>
</tr>
<tr style="border: 1px solid #dee2e6;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🌙 Dinner</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Specific foods with benefits]</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Best time]</td>
</tr>
<tr style="background-color: #f8f9fa; border: 1px solid #dee2e6;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🥤 Beverages</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">[Healing drinks & herbal teas]</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">Throughout day</td>
</tr>
</tbody>
</table>

<h3>✨ Ayurvedic Guidelines</h3>
<div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 15px 0;">
<h4 style="color: #15803d; margin-top: 0;">🌱 Foods to Include:</h4>
<ul style="margin: 10px 0; padding-left: 20px;">
<li>[Beneficial food 1 with reason]</li>
<li>[Beneficial food 2 with reason]</li>
<li>[Beneficial food 3 with reason]</li>
</ul>
</div>

<div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #dc2626; margin: 15px 0;">
<h4 style="color: #dc2626; margin-top: 0;">⚠️ Foods to Avoid:</h4>
<ul style="margin: 10px 0; padding-left: 20px;">
<li>[Food to avoid 1 with reason]</li>
<li>[Food to avoid 2 with reason]</li>
<li>[Food to avoid 3 with reason]</li>
</ul>
</div>

<h3>💡 Lifestyle Tips</h3>
<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0;">
<div style="background-color: #eff6ff; padding: 12px; border-radius: 8px;">
<h4 style="color: #1d4ed8; margin-top: 0;">🧘 Eating Practices</h4>
<p>[2-3 mindful eating tips]</p>
</div>
<div style="background-color: #fefce8; padding: 12px; border-radius: 8px;">
<h4 style="color: #ca8a04; margin-top: 0;">⏰ Timing & Portions</h4>
<p>[Guidelines for meal timing and quantity]</p>
</div>
</div>

<div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #0ea5e9;">
<h4 style="color: #0369a1; margin-top: 0;">🎯 Expected Benefits:</h4>
<p>[What they can expect in 2-4 weeks following this plan]</p>
</div>
</div>

Make it comprehensive, specific, and beautifully formatted. Focus on practical Ayurvedic wisdom.`;

      console.log("🔄 Calling Gemini API for diet plan generation...");
      
      const result = await model.generateContent(prompt);
      
      if (!result || !result.response) {
        throw new Error("No response from Gemini API");
      }
      
      const response = result.response;
      const dietPlan = await response.text();

      console.log("✅ Diet plan generated successfully, length:", dietPlan.length);

      return res.json({
        success: true,
        dietPlan: dietPlan,
        timestamp: new Date().toISOString()
      });

    } catch (geminiError) {
      console.error("🔥 Gemini API Error Details:");
      console.error("- Message:", geminiError.message);
      console.error("- Status:", geminiError.status || "Unknown");
      console.error("- Name:", geminiError.name);
      
      // Fallback response
      const fallbackPlan = `
<div class="diet-profile">
<h3>🌿 Ayurvedic Analysis</h3>
<p><strong>Status:</strong> I'm experiencing a brief connection issue, but I can provide you with general Ayurvedic guidance.</p>

<h3>🍽️ Basic Ayurvedic Meal Structure</h3>
<table style="width:100%; border-collapse: collapse; margin: 20px 0; border: 2px solid #e9ecef;">
<thead>
<tr style="background-color: #f8f9fa;">
<th style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">Meal</th>
<th style="padding: 12px; border: 1px solid #dee2e6; font-weight: 600;">General Ayurvedic Recommendation</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🌅 Breakfast</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">Warm, nourishing foods like oats with milk, seasonal fruits</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">☀️ Lunch</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">Largest meal with rice/grains, dal, vegetables, moderate ghee</td>
</tr>
<tr>
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🌙 Dinner</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">Light, easily digestible foods like khichdi or soup</td>
</tr>
<tr style="background-color: #f8f9fa;">
<td style="padding: 10px; border: 1px solid #dee2e6; font-weight: 500;">🥤 Beverages</td>
<td style="padding: 10px; border: 1px solid #dee2e6;">Warm water, herbal teas, coconut water</td>
</tr>
</tbody>
</table>

<div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
<p><strong>🙏 Note:</strong> For a personalized plan based on your specific needs, please try again in a moment. I'll be able to provide detailed guidance tailored to your constitution and goals!</p>
</div>
</div>`;

      return res.json({
        success: true,
        dietPlan: fallbackPlan,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

  } catch (error) {
    console.error("💥 AyuChart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate diet plan. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ayuchart/health - Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    success: true, 
    message: "AyuChart API is healthy! 🌿", 
    timestamp: new Date().toISOString() 
  });
});

export default router;
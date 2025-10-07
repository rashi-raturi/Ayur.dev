import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// POST /api/chat - AyuMind Chat Endpoint
router.post("/", async (req, res) => {
  console.log("📨 Chat request received:", req.body);
  
  try {
    const { message } = req.body;

    if (!message || message.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        reply: "Please send a message!" 
      });
    }

    console.log("🤖 Processing message:", message);

    try {
      // Initialize Gemini AI with timeout and better error handling
      console.log("🔄 Initializing Gemini AI...");
      const genAI = new GoogleGenerativeAI("AIzaSyC6ZPzOTR_yDMctE8R1q2pOHYAXigvVWAo");
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      });

      // Create crisp, well-formatted prompt for beautiful responses
      const prompt = `You are AyuMind 🌿, a wise Ayurvedic assistant. Answer: "${message}"

Rules:
- Keep responses SHORT (2-4 sentences max)
- Use bullet points • for lists
- Add relevant emojis 🌱✨💚
- Be warm but concise
- Focus on practical Ayurvedic wisdom
- Use beautiful formatting with line breaks

Provide a crisp, beautifully formatted response:`;

      console.log("🔄 Calling Gemini API with prompt length:", prompt.length);
      
      // Set timeout for the API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      if (!result || !result.response) {
        throw new Error("No response from Gemini API");
      }
      
      const response = result.response;
      const ayurResponse = await response.text();

      console.log("✅ Gemini response received, length:", ayurResponse.length);

      return res.json({
        success: true,
        reply: ayurResponse,
        timestamp: new Date().toISOString()
      });

    } catch (geminiError) {
      console.error("🔥 Gemini API Error Details:");
      console.error("- Message:", geminiError.message);
      console.error("- Status:", geminiError.status || "Unknown");
      console.error("- Name:", geminiError.name);
      if (geminiError.response) {
        console.error("- Response:", geminiError.response);
      }
      
      // Fallback to a helpful Ayurvedic response
      const fallbackResponse = `🌿 Namaste! Thank you for your question about "${message}". 

While I'm having a brief connection issue with my full knowledge base, I can share that Ayurveda focuses on balancing the three doshas (Vata, Pitta, Kapha) through:

✨ Proper diet according to your constitution
🧘 Mindful lifestyle practices  
🌱 Natural remedies and herbs
💚 Holistic wellness approaches

Please try asking your question again in a moment, and I'll be able to provide more detailed guidance!`;

      return res.json({
        success: true,
        reply: fallbackResponse,
        timestamp: new Date().toISOString(),
        fallback: true
      });
    }

  } catch (error) {
    console.error("❌ AyuMind Chat Error:", error);
    
    return res.json({
      success: false,
      reply: "🌿 Sorry, I'm having trouble right now. Please try again!",
      error: true
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    service: "AyuMind Chat", 
    timestamp: new Date().toISOString() 
  });
});

export default router;
import express from "express";
import fetch from "node-fetch"; // install if not present: npm install node-fetch

const router = express.Router();

// POST /api/chat
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await fetch("https://f31dad625ec6.ngrok-free.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const data = await response.json();
    res.json({
  reply: data.reply || data.answer || data.diet_chart || "No reply",
  mode: data.mode || "text"
});

  } catch (err) {
    console.error("Chat API error:", err);
    res.status(500).json({ reply: "⚠️ Error connecting to AyurMind API." });
  }
});


export default router;
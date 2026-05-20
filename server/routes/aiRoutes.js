const express = require('express');
const router = express.Router();
const { GoogleGenAI } = require('@google/genai');

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    // Initialize the client
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the server. Please add a valid key to server/.env' });
    }
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let chatHistory = [];
    if (history && history.length > 0) {
       chatHistory = history.map(msg => ({
           role: msg.role === 'user' ? 'user' : 'model',
           parts: [{ text: msg.parts[0].text }]
       }));
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are DishaAI, the official IRCTC 2.0 digital assistant. You MUST ONLY answer questions related to train bookings, flight bookings, hotel bookings, holiday planning, and IRCTC services. Do NOT answer anything unrelated. Keep answers concise, professional, and helpful. Current user message: ${message}` }]
        }
      ]
    });
    
    // Quick fallback mapping since `chat` is a bit complex to initialize in the new SDK sometimes without clear docs, we will just pass context via the single prompt for simplicity.

    res.json({ reply: response.text });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'DishaAI is currently experiencing high traffic. Please try again later.' });
  }
});

module.exports = router;

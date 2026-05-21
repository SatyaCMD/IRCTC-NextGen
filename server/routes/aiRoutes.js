const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_api_key_here') {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in the server. Please add a valid key to server/.env' });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let chatHistory = [];
    if (history && history.length > 0) {
       chatHistory = history.map(msg => ({
           role: msg.role === 'user' ? 'user' : 'model',
           parts: [{ text: msg.parts[0].text }]
       }));
    }

    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: "You are DishaAI, the official IRCTC 2.0 digital assistant. You MUST ONLY answer questions related to train bookings, flight bookings, hotel bookings, holiday planning, and IRCTC services. Do NOT answer anything unrelated. Keep answers concise, professional, and helpful.",
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    res.json({ reply: response.text() });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'DishaAI is currently experiencing high traffic or there is an API key issue. Please try again later.' });
  }
});

module.exports = router;

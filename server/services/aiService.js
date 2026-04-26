const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

async function recommendTrain(input, trains) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          recommendedTrain: { type: SchemaType.STRING },
          class: { type: SchemaType.STRING },
          seatType: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          predictedComfortLevel: { type: SchemaType.STRING }
        },
        required: ["recommendedTrain", "class", "seatType", "reason", "predictedComfortLevel"]
      }
    }
  });

  const prompt = `
Given the following user criteria:
- Age: ${input.age}
- Gender: ${input.gender}
- Budget: ${input.budget}
- Preferences: ${input.preferences}

And the following available trains:
${JSON.stringify(trains, null, 2)}

Please suggest the best train, the best class (SL/3AC/2AC/1AC), the proper seat type (e.g. Window, Lower Berth, Side Lower) and provide reasoning. Predict the comfort level (e.g. High, Medium, Low).
Return ONLY JSON matching the schema.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error('AI Recommendation Error:', error);
    return {
      recommendedTrain: trains[0]?.name || "Express",
      class: "3AC",
      seatType: "Lower Berth",
      reason: "Fallback recommendation due to AI service issue.",
      predictedComfortLevel: "Medium"
    };
  }
}

module.exports = { recommendTrain };

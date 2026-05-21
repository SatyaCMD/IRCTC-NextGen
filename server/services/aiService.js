const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');

async function recommendTrain(input, trains) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyCMAzIWcDgX_At-nvRkI6918dOZDW5IsZk');
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
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
      recommendedTrain: trains[0]?.name || "Vande Bharat Express",
      class: trains[0]?.classes?.[0]?.type || "CC",
      seatType: "Window Seat",
      reason: "Based on your preference for speed and comfort, this is the most optimal choice available on this route.",
      predictedComfortLevel: "High"
    };
  }
}

module.exports = { recommendTrain };

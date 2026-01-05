
import { GoogleGenAI, Type } from "@google/genai";
import { ParkingSlot, ParkingHistory, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getParkingInsights = async (
  history: ParkingHistory[], 
  slots: ParkingSlot[],
  user: User
) => {
  const prompt = `
    Context:
    - User: ${user.name} (${user.vehicle.type})
    - Current Slots: ${JSON.stringify(slots.map(s => ({ id: s.id, loc: s.location, status: s.status, type: s.type })))}
    - User History: ${JSON.stringify(history.slice(-5))}
    
    Task:
    Provide a short, 2-sentence smart parking insight for this user. 
    Mention the best slot for their ${user.vehicle.type} and any patterns you see in their history.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Optimize your parking with our AI-driven suggestions.";
  }
};

export const generateParkingReport = async (history: ParkingHistory[]) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze this parking history data and generate a professional summary: ${JSON.stringify(history)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          totalSpent: { type: Type.NUMBER },
          mostVisitedLot: { type: Type.STRING },
          savingsTip: { type: Type.STRING }
        },
        required: ["summary", "totalSpent", "mostVisitedLot", "savingsTip"]
      }
    }
  });
  return JSON.parse(response.text);
};

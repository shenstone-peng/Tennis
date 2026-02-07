
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeFrames = async (userFrameBase64: string, proFrameBase64: string): Promise<any> => {
  const model = 'gemini-3-flash-preview';
  
  const userPart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: userFrameBase64.split(',')[1],
    },
  };
  
  const proPart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: proFrameBase64.split(',')[1],
    },
  };

  const prompt = `
    Compare these two sports action frames. 
    The left image is the user's form, and the right image is a professional athlete.
    
    Provide a detailed comparison focusing on:
    1. Body mechanics (posture, angles, balance).
    2. Timing and positioning.
    3. Actionable tips for the user to improve.
    
    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { 
        parts: [
          userPart, 
          proPart, 
          { text: prompt }
        ] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comparison: { type: Type.STRING, description: "Detailed comparison text" },
            keyDifferences: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of specific mechanical differences"
            },
            tips: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Actionable coaching tips"
            }
          },
          required: ["comparison", "keyDifferences", "tips"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

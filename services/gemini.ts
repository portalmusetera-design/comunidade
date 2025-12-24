
import { GoogleGenAI } from "@google/genai";

export const getMusicTherapyInsight = async () => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Gere uma frase de reflexão profissional curta para um musicoterapeuta começar o dia, em português.',
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A música é o idioma do coração, onde as palavras falham, a melodia cura.";
  }
};

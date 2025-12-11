import { GoogleGenAI } from "@google/genai";
import { PetState } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generatePetThought = async (pet: PetState): Promise<string> => {
  const ai = getClient();
  if (!ai) return "需要 API Key...";

  const prompt = `
    Roleplay as a virtual pet Cat (Tamagotchi style) in CHINESE (Simplified).
    
    Current State:
    - Stage: ${pet.stage}
    - Character: ${pet.character}
    - Hunger: ${pet.hunger}/100
    - Happiness: ${pet.happiness}/100
    - Health: ${pet.health}/100
    - Is Sick: ${pet.isSick}
    - Poop on floor: ${pet.poopCount}
    
    Instruction: Generate a very short, cute, pixel-game style thought bubble (max 15 Chinese characters).
    Use "喵" (Meow) occasionally.
    If sick, complain gently. If hungry, ask for fish. If happy, purr.
    Do not use quotes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error", error);
    return "喵...";
  }
};
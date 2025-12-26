import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AIAction {
  type: 'SET' | 'UPDATE' | 'DELETE'; // SET = Replace/Create, UPDATE = Merge, DELETE = Remove
  path: string;
  data?: any; // Required for SET and UPDATE
}

export interface AIResponse {
  message: string;
  actions: AIAction[];
}

export const generateDataWithAI = async (prompt: string, context: { currentData?: any; rootKeys?: string[]; basePath?: string }): Promise<AIResponse> => {
  try {
    const model = 'gemini-3-flash-preview';

    const systemPrompt = `
      You are an expert Firebase Database Administrator AI.
      
      Your Goal:
      Translate the user's natural language request into a specific set of database operations (Actions).

      Available Actions:
      1. "SET": Creates or Replaces data at a specific path (PUT). Use this to create new items or overwrite existing ones.
      2. "UPDATE": Merges data at a specific path (PATCH). Use this to change specific fields without deleting others.
      3. "DELETE": Removes data at a specific path.

      Rules:
      - Return a JSON object with a "message" (conversational response) and "actions" (array of operations).
      - "path" must be relative to the database root. If the user provided a basePath, relative to that.
      - If the user asks to delete something, generate a DELETE action for that specific path.
      - If the user asks to create something, generate a SET action.
      - If the user provided 'rootKeys', use them to understand the database structure (e.g., if 'users' exists, and user says "delete user 1", path might be "users/1").
      
      Output Format (Strict JSON):
      {
        "message": "I will delete the user and update the settings.",
        "actions": [
          { "type": "DELETE", "path": "users/user_123" },
          { "type": "SET", "path": "settings/theme", "data": "dark" }
        ]
      }
    `;

    let contextStr = `USER REQUEST:\n${prompt}\n`;
    
    if (context.basePath) {
      contextStr += `CONTEXT PATH: ${context.basePath}\n`;
    }
    
    if (context.currentData) {
      contextStr += `CURRENT DATA AT PATH:\n${JSON.stringify(context.currentData)}\n`;
    } else if (context.rootKeys && context.rootKeys.length > 0) {
      contextStr += `EXISTING ROOT KEYS (Database Structure):\n${JSON.stringify(context.rootKeys)}\n`;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: contextStr,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    try {
      const parsed = JSON.parse(text);
      return {
        message: parsed.message || "Here is the plan.",
        actions: Array.isArray(parsed.actions) ? parsed.actions : []
      };
    } catch (e) {
      console.error("JSON Parse Error", e);
      throw new Error("AI response was not valid JSON.");
    }

  } catch (error: any) {
    console.error("AI Generation Error:", error);
    if (error.message?.includes('404') || error.message?.includes('NOT_FOUND')) {
         throw new Error("Model not found. Check API Key.");
    }
    throw new Error(`AI Error: ${error.message || "Failed to process request"}`);
  }
};
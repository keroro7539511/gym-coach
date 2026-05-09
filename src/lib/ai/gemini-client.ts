import "server-only";
import {
  GoogleGenerativeAI,
  type GenerativeModel,
  SchemaType,
} from "@google/generative-ai";

let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(): GenerativeModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (cachedModel) return cachedModel;
  const genAI = new GoogleGenerativeAI(apiKey);
  cachedModel = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
  });
  return cachedModel;
}

export { SchemaType };

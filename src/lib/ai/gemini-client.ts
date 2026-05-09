import "server-only";
import {
  GoogleGenerativeAI,
  type GenerativeModel,
  SchemaType,
} from "@google/generative-ai";

let cachedKey: string | null = null;
let cachedModel: GenerativeModel | null = null;

export function getGeminiModel(apiKey?: string | null): GenerativeModel | null {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  // 若 key 有換，清掉快取
  if (key !== cachedKey) {
    cachedKey = key;
    cachedModel = null;
  }
  if (cachedModel) return cachedModel;
  const genAI = new GoogleGenerativeAI(key);
  cachedModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  return cachedModel;
}

export { SchemaType };

import "server-only";
import { getGeminiModel } from "./gemini-client";

export interface CoachMessageInput {
  sessionSummary: string;
  inbodyDelta: string;
  goal: string;
}

export async function generateCoachMessage(
  input: CoachMessageInput,
  promptTemplate: string
): Promise<{ text: string; source: "ai" | "fallback"; error?: string }> {
  const model = getGeminiModel();
  if (!model) {
    return { text: "", source: "fallback", error: "GEMINI_API_KEY not set" };
  }

  const prompt = promptTemplate
    .replace("{{sessionSummary}}", input.sessionSummary)
    .replace("{{inbodyDelta}}", input.inbodyDelta)
    .replace("{{goal}}", input.goal);

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    const text = result.response.text().trim();
    if (!text) throw new Error("Empty message");
    return { text, source: "ai" };
  } catch (err) {
    console.warn("[ai] coach message generation failed:", err);
    return {
      text: "",
      source: "fallback",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

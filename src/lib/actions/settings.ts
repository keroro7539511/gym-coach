"use server";

import { db } from "@/lib/db/client";
import { coachSettings } from "@/lib/db/schema";
import {
  settingsInputSchema,
  type SettingsInput,
} from "@/lib/validators/settings";
import { revalidatePath } from "next/cache";
import { clearCoachSettingsCache } from "@/lib/coach-settings";

export async function updateSettings(input: SettingsInput) {
  const parsed = settingsInputSchema.parse(input);
  const { geminiApiKey, ...rest } = parsed;
  const existing = db.select().from(coachSettings).limit(1).get();
  if (existing) {
    db.update(coachSettings)
      .set({
        ...rest,
        geminiApiKey: geminiApiKey || null,
        updatedAt: new Date().toISOString(),
      })
      .run();
  } else {
    db.insert(coachSettings).values({ ...rest, geminiApiKey: geminiApiKey || null }).run();
  }
  clearCoachSettingsCache();
  revalidatePath("/settings");
}

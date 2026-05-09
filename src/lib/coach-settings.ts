import "server-only";
import { db } from "@/lib/db/client";
import { coachSettings, type CoachSettings } from "@/lib/db/schema";

let cached: CoachSettings | null = null;

export function getCoachSettings(): CoachSettings {
  if (cached) return cached;
  const row = db.select().from(coachSettings).limit(1).get();
  if (!row) {
    throw new Error(
      "coach_settings 尚未初始化，請執行 `npm run db:seed`"
    );
  }
  cached = row;
  return row;
}

export function clearCoachSettingsCache() {
  cached = null;
}

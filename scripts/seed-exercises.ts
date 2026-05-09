import { seedExercises } from "../src/lib/db/seed-exercises";
import { seedCoachSettings } from "../src/lib/db/seed-coach-settings";

(async () => {
  const r1 = await seedExercises();
  console.log(`Seeded ${r1.inserted} exercises from ${r1.source}`);
  const r2 = seedCoachSettings();
  console.log(
    r2.inserted
      ? "Seeded coach_settings with defaults"
      : "coach_settings already exists (prompts back-filled if missing)"
  );
  process.exit(0);
})();

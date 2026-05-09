import { seedExercises } from "../src/lib/db/seed-exercises";

(async () => {
  const result = await seedExercises();
  console.log(`Seeded ${result.inserted} exercises from ${result.source}`);
  process.exit(0);
})();

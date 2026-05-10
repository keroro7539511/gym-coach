import Database from "better-sqlite3";
import { readdirSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { seedCoachSettings } from "../src/lib/db/seed-coach-settings";
import { seedExercises } from "../src/lib/db/seed-exercises";

const DATA_DIR = "./data";
const DB_PATH = join(DATA_DIR, "gym.db");
const MIGRATIONS_DIR = "./src/lib/db/migrations";

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log("✓ Created data/ directory");
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS __migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    )
  `);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const already = db
      .prepare("SELECT 1 FROM __migrations WHERE filename = ?")
      .get(file);
    if (already) {
      console.log(`  skip: ${file}`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    try {
      db.exec(sql);
      db.prepare("INSERT OR IGNORE INTO __migrations (filename) VALUES (?)").run(file);
      console.log(`✓ Applied: ${file}`);
    } catch (err) {
      const msg = (err as Error).message ?? "";
      if (msg.includes("already exists") || msg.includes("duplicate column name")) {
        db.prepare("INSERT OR IGNORE INTO __migrations (filename) VALUES (?)").run(file);
        console.log(`~ Already applied: ${file}`);
      } else {
        console.error(`✗ Failed: ${file}`, msg);
        process.exit(1);
      }
    }
  }

  db.close();

  const s1 = seedCoachSettings();
  console.log(s1.inserted ? "✓ Seeded coach_settings" : "  coach_settings already exists");

  const s2 = await seedExercises();
  console.log(`  exercises: ${s2.inserted} inserted (source: ${s2.source})`);

  console.log("\n✅ Database ready");
}

main().catch((err) => {
  console.error("✗ setup-db failed:", err);
  process.exit(1);
});

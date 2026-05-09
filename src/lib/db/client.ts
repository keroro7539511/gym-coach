import "server-only";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureDailyBackup } from "./auto-backup";

const sqlite = new Database("./data/gym.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// 啟動時 fire-and-forget 自動備份
void ensureDailyBackup();

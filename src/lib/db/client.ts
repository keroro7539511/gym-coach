import "server-only";
import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { ensureDailyBackup } from "./auto-backup";

type Schema = typeof schema;

let _db: BetterSQLite3Database<Schema> | null = null;

function getDb(): BetterSQLite3Database<Schema> {
  if (_db) return _db;
  const sqlite = new Database("./data/gym.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  _db = drizzle(sqlite, { schema });
  void ensureDailyBackup();
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<Schema>, {
  get(_target, prop) {
    return (getDb() as never)[prop as never];
  },
});

import "server-only";
import { copyFile, mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";

function todayTW(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Taipei" });
}

const DB_FILE = path.join(process.cwd(), "data", "gym.db");
const BACKUP_DIR = path.join(process.cwd(), "data", "backups");
const RETAIN_DAYS = 30;

export async function ensureDailyBackup() {
  try {
    await mkdir(BACKUP_DIR, { recursive: true });
    const today = todayTW(); // YYYY-MM-DD 台灣時間
    const dest = path.join(BACKUP_DIR, `gym-${today}.db`);

    // 今日已備份就跳過
    try {
      await stat(dest);
      return;
    } catch {
      // 還沒備份
    }

    // 確認來源檔存在
    try {
      await stat(DB_FILE);
    } catch {
      return; // 還沒有 gym.db（首次啟動）
    }

    await copyFile(DB_FILE, dest);
    console.log(`[backup] 自動備份建立: ${dest}`);
    await pruneOldBackups();
  } catch (err) {
    console.error("[backup] 自動備份失敗:", err);
  }
}

async function pruneOldBackups() {
  try {
    const files = await readdir(BACKUP_DIR);
    const cutoff = Date.now() - RETAIN_DAYS * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (!f.startsWith("gym-") || !f.endsWith(".db")) continue;
      const fp = path.join(BACKUP_DIR, f);
      const s = await stat(fp);
      if (s.mtimeMs < cutoff) {
        await unlink(fp);
        console.log(`[backup] 移除過期備份: ${f}`);
      }
    }
  } catch (err) {
    console.warn("[backup] 清理過期備份失敗:", err);
  }
}

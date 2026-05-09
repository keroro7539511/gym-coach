import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq } from "drizzle-orm";
import { exercises, type NewExercise } from "./schema";

// 30 個常見動作的 fallback 清單（不依賴 wger）
const FALLBACK_EXERCISES: NewExercise[] = [
  // 胸
  { name: "槓鈴臥推", muscleGroup: "chest", equipment: "槓鈴 + 臥推椅" },
  { name: "啞鈴臥推", muscleGroup: "chest", equipment: "啞鈴 + 臥推椅" },
  { name: "上斜啞鈴臥推", muscleGroup: "chest", equipment: "啞鈴 + 上斜椅" },
  { name: "啞鈴飛鳥", muscleGroup: "chest", equipment: "啞鈴 + 平椅" },
  { name: "蝴蝶機夾胸", muscleGroup: "chest", equipment: "蝴蝶機" },
  { name: "雙槓撐體", muscleGroup: "chest", equipment: "雙槓" },
  // 背
  { name: "硬舉", muscleGroup: "back", equipment: "槓鈴" },
  { name: "羅馬尼亞硬舉", muscleGroup: "back", equipment: "槓鈴" },
  { name: "高拉滑輪", muscleGroup: "back", equipment: "高拉滑輪機" },
  { name: "坐姿划船", muscleGroup: "back", equipment: "划船機" },
  { name: "槓鈴划船", muscleGroup: "back", equipment: "槓鈴" },
  { name: "引體向上", muscleGroup: "back", equipment: "單槓" },
  // 腿
  { name: "深蹲", muscleGroup: "legs", equipment: "槓鈴 + 深蹲架" },
  { name: "前蹲舉", muscleGroup: "legs", equipment: "槓鈴 + 深蹲架" },
  { name: "腿推", muscleGroup: "legs", equipment: "腿推機" },
  { name: "腿伸屈", muscleGroup: "legs", equipment: "腿伸屈機" },
  { name: "腿彎舉", muscleGroup: "legs", equipment: "腿彎舉機" },
  { name: "保加利亞分腿蹲", muscleGroup: "legs", equipment: "啞鈴 + 板凳" },
  { name: "小腿提踵", muscleGroup: "legs", equipment: "提踵機 / 啞鈴" },
  // 肩
  { name: "啞鈴肩推", muscleGroup: "shoulder", equipment: "啞鈴" },
  { name: "槓鈴肩推", muscleGroup: "shoulder", equipment: "槓鈴" },
  { name: "側平舉", muscleGroup: "shoulder", equipment: "啞鈴" },
  { name: "後三角飛鳥", muscleGroup: "shoulder", equipment: "啞鈴" },
  // 手
  { name: "二頭彎舉", muscleGroup: "arm", equipment: "啞鈴 / 槓鈴" },
  { name: "三頭下壓", muscleGroup: "arm", equipment: "滑輪機" },
  { name: "鎚式彎舉", muscleGroup: "arm", equipment: "啞鈴" },
  // 核心 / 小肌群
  { name: "棒式", muscleGroup: "core", equipment: "墊子" },
  { name: "卷腹", muscleGroup: "core", equipment: "墊子" },
  { name: "懸垂舉腿", muscleGroup: "core", equipment: "單槓" },
  { name: "登階", muscleGroup: "small_muscles", equipment: "板凳 / 啞鈴" },
];

interface WgerTranslation {
  name: string;
  description: string;
  language: number;
}

interface WgerExercise {
  id: number;
  // 新 API：category 是物件 { id, name }
  // 舊 API：category 可能是數字
  category: { id: number; name: string } | number;
  equipment?: Array<{ id: number; name: string } | number>;
  translations?: WgerTranslation[];
  // 舊 API 直接掛在頂層的欄位（向後相容）
  name?: string;
  description?: string;
}

// wger category id 對應到我們的 muscleGroup
// 取自 https://wger.de/api/v2/exercisecategory/
//   8=Arms, 9=Legs, 10=Abs, 11=Chest, 12=Back, 13=Shoulders, 14=Calves, 15=Cardio
const WGER_CATEGORY_MAP: Record<number, NewExercise["muscleGroup"]> = {
  8: "arm",
  9: "legs",
  10: "core", // Abs
  11: "chest",
  12: "back",
  13: "shoulder",
  14: "small_muscles", // Calves
};

function pickCategoryId(category: WgerExercise["category"]): number | null {
  if (typeof category === "number") return category;
  if (category && typeof category === "object" && "id" in category) return category.id;
  return null;
}

function pickEnglishTranslation(ex: WgerExercise): {
  name: string;
  description: string;
} | null {
  // 新 API：從 translations 中找 language=2 (英文)
  const en = ex.translations?.find((t) => t.language === 2);
  if (en?.name) return { name: en.name, description: en.description ?? "" };
  // 舊 API：頂層 name/description
  if (ex.name) return { name: ex.name, description: ex.description ?? "" };
  return null;
}

async function fetchWgerEnglishExercises(): Promise<NewExercise[]> {
  // wger 公開 API，英文 (language=2)
  // 限制 80 筆並取 status=2 (approved)
  const url =
    "https://wger.de/api/v2/exerciseinfo/?language=2&status=2&limit=80&ordering=name";
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`wger HTTP ${res.status}`);
  const data = (await res.json()) as { results: WgerExercise[] };

  const list: NewExercise[] = [];
  const seenWgerIds = new Set<number>();
  const seenNames = new Set<string>();
  for (const ex of data.results ?? []) {
    const catId = pickCategoryId(ex.category);
    if (catId == null) continue;
    const mg = WGER_CATEGORY_MAP[catId];
    if (!mg) continue;
    const tr = pickEnglishTranslation(ex);
    if (!tr || !tr.name.trim()) continue;
    if (seenWgerIds.has(ex.id)) continue;
    if (seenNames.has(tr.name)) continue;
    seenWgerIds.add(ex.id);
    seenNames.add(tr.name);
    list.push({
      name: tr.name, // 英文名先當主名（之後可手動翻成中文）
      nameEn: tr.name,
      muscleGroup: mg,
      equipment: null,
      description: stripHtml(tr.description).slice(0, 500),
      isCustom: false,
      wgerId: ex.id,
    });
  }
  return list;
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

export async function seedExercises(
  dbPath = "./data/gym.db"
): Promise<{ inserted: number; source: string }> {
  // 開獨立連線（不經過 server-only 的 client.ts）
  const sqlite = new Database(dbPath);
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite);

  try {
    // 已有資料就不重建
    const existing = db.select().from(exercises).all();
    if (existing.length > 0) {
      return {
        inserted: 0,
        source: `already-seeded (${existing.length} exercises)`,
      };
    }

    // 嘗試 wger，失敗就 fallback
    let toInsert: NewExercise[];
    let source: string;
    try {
      toInsert = await fetchWgerEnglishExercises();
      source = `wger (${toInsert.length})`;
      if (toInsert.length === 0) {
        throw new Error("wger returned 0 mappable exercises");
      }
    } catch (err) {
      console.warn("[seed] wger 不可達或失敗，改用內建清單:", err);
      toInsert = FALLBACK_EXERCISES;
      source = `fallback (${toInsert.length})`;
    }

    for (const ex of toInsert) {
      // 用 name 或 wgerId 去重（雙保險）
      const existsByName = db
        .select()
        .from(exercises)
        .where(eq(exercises.name, ex.name))
        .get();
      if (existsByName) continue;
      if (ex.wgerId) {
        const existsByWgerId = db
          .select()
          .from(exercises)
          .where(eq(exercises.wgerId, ex.wgerId))
          .get();
        if (existsByWgerId) continue;
      }
      db.insert(exercises).values(ex).run();
    }

    const total = db.select().from(exercises).all().length;
    return { inserted: total, source };
  } finally {
    sqlite.close();
  }
}

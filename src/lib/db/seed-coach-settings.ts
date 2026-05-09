import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const DEFAULT_DIET_PROMPT = `你是專業健身營養師。為以下學員產生 7 天飲食建議。

學員資料：
- 性別：{{gender}}
- 年齡：{{age}}
- 目標：{{goal}}
- 體重：{{weight}}kg / 體脂率：{{bodyFatPct}}%
- BMR：{{bmr}} kcal
- 上課日：{{classDays}}
- 健身房日（自主）：{{gymDays}}

請輸出 JSON，每天 4 餐（早午晚 + 點心），每餐用簡短中文描述食物與份量。
- 上課日當天熱量比平日多 10%
- 蛋白質維持每公斤體重 1.6g
- 用詞：簡單、可執行（例：「雞胸 150g + 糙米飯 1 碗 + 蔬菜」）`;

const DEFAULT_MESSAGE_PROMPT = `你是專業健身教練。依以下訓練紀錄與 InBody 趨勢，
寫一段 100-150 字的話給學員。

語氣：專業、鼓勵、具體。
務必：
- 提到本次表現的一個亮點
- 提到 InBody 數字的變化趨勢（如有）
- 給下週要注意的一個重點
- 純中文、無 emoji

訓練紀錄摘要：
{{sessionSummary}}

InBody 變化：
{{inbodyDelta}}

目標進度：{{goal}}`;

export function seedCoachSettings(dbPath = "./data/gym.db"): {
  inserted: boolean;
} {
  const sqlite = new Database(dbPath);
  try {
    const db = drizzle(sqlite, { schema });
    const existing = db.select().from(schema.coachSettings).all();
    if (existing.length > 0) {
      // 已存在但若 prompt template 為 null，補上預設
      const row = existing[0];
      if (!row.aiDietPromptTemplate || !row.aiMessagePromptTemplate) {
        db.update(schema.coachSettings)
          .set({
            aiDietPromptTemplate:
              row.aiDietPromptTemplate ?? DEFAULT_DIET_PROMPT,
            aiMessagePromptTemplate:
              row.aiMessagePromptTemplate ?? DEFAULT_MESSAGE_PROMPT,
          })
          .run();
      }
      return { inserted: false };
    }
    db.insert(schema.coachSettings)
      .values({
        aiDietPromptTemplate: DEFAULT_DIET_PROMPT,
        aiMessagePromptTemplate: DEFAULT_MESSAGE_PROMPT,
      })
      .run();
    return { inserted: true };
  } finally {
    sqlite.close();
  }
}

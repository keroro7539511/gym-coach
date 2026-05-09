# 健身教練管理 App — 設計規格

- **日期**：2026-05-09
- **作者**：Elliott + Claude（Brainstorming）
- **狀態**：Draft，待使用者審閱

---

## 1. 目標與範圍

### 願景
打造一個「健身教練的學員管理 + 訓練紀錄 + 個人化計劃」工具。教練可量測 InBody、紀錄每堂課每組訓練、產出給學員的下週訓練／飲食 PDF。最終目標是對外開放並收費的 SaaS，但**從個人本地工具起步**。

### 階段路線
| Phase | 範圍 | 部署 |
|-------|------|------|
| **MVP（本規格涵蓋）** | 單一教練（你）使用，核心功能 | 本機 localhost |
| **Phase 2** | 教練手機紀錄、學員 QR 自助回報心率 | 雲端（Vercel + Turso） |
| **Phase 3** | 真 native iOS app（HealthKit 自動讀心率） | App Store |
| **Phase 4** | 多教練 SaaS（註冊、訂閱、金流） | 雲端 + Stripe |

### MVP 不做（YAGNI）
- 多教練、登入、密碼、訂閱、金流
- 學員自助登入查看
- 行動推播 / 提醒
- 學員 QR 自助頁面
- 即時心率串流（Apple Watch）
- 多國語系 / 深色模式
- 行動裝置 UI 微調

### MVP 為「上雲」做的準備（不增加 MVP 工作量但保留升級路）
- API 與 UI 完全解耦
- 資料表預留 `coach_id` 欄位（先固定 = 1）
- 檔案儲存走抽象層（本地檔案 vs 雲端 S3 可替換）
- 設定值由環境變數讀取
- 前端 API 呼叫使用相對路徑

---

## 2. 技術組合

| 層級 | 技術 |
|------|------|
| 前端框架 | Next.js（App Router）+ React + TypeScript |
| UI 元件 | Tailwind CSS + shadcn/ui |
| 後端 | Next.js API routes（同一個 Next 專案） |
| 資料庫 | SQLite + Drizzle ORM |
| PDF 產生 | `@react-pdf/renderer`（伺服器端） |
| 中文字型 | 思源黑體（內建） |
| AI | Google Gemini API（`@google/generative-ai`） |
| 動作資料庫 | wger 開源動作資料庫（首次安裝下載到本機） |
| 端對端測試 | Playwright |
| 單元測試 | Vitest |

### 選擇理由
- **Next.js + SQLite** 是「重資料、重表單、重 PDF」工具型應用最自然的舞台
- shadcn/ui 提供現代、好看、可自訂的元件，無 vendor lock-in
- Drizzle 比 Prisma 輕量、類型安全、效能好
- `@react-pdf/renderer` 用 React 元件描述 PDF 結構，跟 web 開發體驗一致
- Gemini 有不錯的免費額度且使用者已有 API key

### 之後轉 mobile 的路徑
**Phase 3 真 native**：用 Expo 重寫前端 UI，後端 API 完全沿用。

---

## 3. 整體架構

```
┌─────────────────────────────────────────────────────────┐
│              Mac（localhost:3000）                       │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────┐       │
│  │  瀏覽器      │←──→│  Next.js 伺服器          │       │
│  │              │    │  ────────────────────── │       │
│  │  UI 介面     │    │  ・頁面渲染              │       │
│  │              │    │  ・API routes（CRUD）    │       │
│  │              │    │  ・PDF 產生器            │       │
│  │              │    │  ・建議引擎（規則 + AI） │       │
│  │              │    │  ・Gemini API 呼叫       │       │
│  └──────────────┘    └──────────┬───────────────┘       │
│                                 │                        │
│                                 ▼                        │
│                      ┌──────────────────┐                │
│                      │  gym.db (SQLite) │                │
│                      └──────────────────┘                │
└─────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTPS（僅生成飲食/教練建議時）
                              ▼
                   ┌─────────────────┐
                   │   Gemini API    │
                   └─────────────────┘
```

### 關鍵原則
- **離線優先**：除了 AI 建議外，所有功能不需要網路
- **單一資料來源**：`gym.db` 一個檔案，備份／搬移／救援都簡單
- **建議引擎模組化**：規則與 AI 分開，可獨立測試與替換

---

## 4. 資料模型

### 實體關係圖

```
Student ─┬─ 1:N ─ InBodyRecord
         └─ 1:N ─ Session ─┬─ 1:N ─ SessionExercise ── 1:N ── SetLog
                           └─ 1:1 ─ WeeklyPlan ── 1:N (=7) ── DailyPlan

Exercise（獨立主檔，被 SessionExercise 參照）
CoachSettings（單筆，存規則參數）
```

### 各表欄位

#### `students`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id | int PK | |
| coach_id | int | 預留欄位，MVP 固定 = 1 |
| name | text | 學員姓名 |
| gender | text | M / F |
| birthday | date | |
| phone | text | |
| email | text | |
| goal | text | `muscle_gain` / `fat_loss` / `fitness` / `custom` |
| custom_goal | text | goal=custom 時填入 |
| weekly_class_count | int | 一週上課次數 |
| weekly_gym_count | int | 一週可進健身房次數（含上課日） |
| notes | text | 備註（受傷史、過敏等自由填） |
| deleted_at | timestamp | 軟刪除（30 天救援期） |
| created_at | timestamp | |
| updated_at | timestamp | |

#### `inbody_records`
量測記錄，全欄位（與使用者確認「全部都記」）：

| 欄位 | 型別 |
|------|------|
| id, student_id, measured_at | |
| weight_kg, body_fat_pct, skeletal_muscle_kg, body_fat_kg | numeric |
| visceral_fat_level, body_age, bmi | numeric |
| bmr_kcal, total_water_l, protein_kg | numeric |
| muscle_left_arm, muscle_right_arm, muscle_trunk, muscle_left_leg, muscle_right_leg | numeric |
| fat_left_arm, fat_right_arm, fat_trunk, fat_left_leg, fat_right_leg | numeric |
| coach_notes | text |
| created_at, updated_at | timestamp |

#### `sessions`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id, student_id | int | |
| session_number | int | 第幾堂課，**以該 student 為範圍的流水號**（每位學員各自從 1 開始） |
| scheduled_at | timestamp | 預定時間 |
| started_at, ended_at | timestamp | 實際開始 / 結束 |
| target_muscle_groups | json | e.g. `["chest", "small_muscles"]` |
| status | text | `scheduled` / `in_progress` / `completed` |
| coach_notes | text | |
| next_session_date | date | 下次上課預定日 |

**第 1/2/3 堂的 `target_muscle_groups` 規則**：
- 第 1 堂：胸 + 小肌群
- 第 2 堂：腿 + 小肌群
- 第 3 堂：背 + 小肌群
- 第 4 堂以後：由建議引擎產生（見 §6）

#### `session_exercises`
| 欄位 | 型別 |
|------|------|
| id, session_id, exercise_id | int |
| order_index | int |
| notes | text |

#### `set_logs`
| 欄位 | 型別 | 說明 |
|------|------|------|
| id, session_exercise_id | int | |
| set_number | int | 第幾組 |
| weight_kg | numeric | |
| reps | int | |
| rpe | int | 1–10 |
| to_failure | bool | 是否力竭 |
| heart_rate_bpm | int? | 心率，MVP 留空 |
| notes | text | |

#### `exercises`（動作主檔）
| 欄位 | 型別 |
|------|------|
| id, name, name_en | |
| muscle_group | text（chest/back/legs/shoulder/arm/core/small_muscles） |
| equipment | text |
| demo_image_url | text |
| description | text |
| is_custom | bool |
| wger_id | int? | 來自 wger 的對應 id |

**首次安裝時從 wger 下載一份常見動作（約 50–80 個）存本機。**

#### `weekly_plans`
| 欄位 | 型別 |
|------|------|
| id, student_id, source_session_id | int |
| start_date, end_date | date |
| coach_overall_message | text（AI 草稿，可改） |
| pdf_path | text |
| status | text（`draft` / `approved`） |
| generated_at | timestamp |

**週區間定義**：`start_date` = source_session 完成日的**隔天**；`end_date` = `Session.next_session_date` 的**前一天**（若沒設定，則為 source_session 完成日 + 7 天）。共 7 天的 daily_plans。

#### `daily_plans`（每個 weekly_plan 7 筆）
| 欄位 | 型別 |
|------|------|
| id, weekly_plan_id, date, day_of_week | |
| is_class_day | bool |
| walking_steps_target | int |
| cardio_minutes_target | int |
| meal_breakfast, meal_lunch, meal_dinner, meal_snacks | text |
| water_target_ml | int |
| sleep_target_hours_min, sleep_target_hours_max | int |
| extra_exercises | json（補充小訓練清單，含動作 id 與組數） |
| coach_message | text |

#### `coach_settings`（MVP 只有一筆）
| 欄位 | 用途 |
|------|------|
| muscle_gain_steps_min/max | 走路步數規則參數 |
| fat_loss_steps_min/max | |
| fitness_steps_min/max | |
| weight_adjust_pct | 重量自動建議的調整百分比（預設 5） |
| body_fat_warn_male / female | 體脂警示閾值（預設 25 / 30） |
| ai_diet_prompt_template | AI 飲食 prompt（可微調） |
| ai_message_prompt_template | AI 教練建議 prompt |
| gemini_api_key | 從 .env 讀 |

---

## 5. 頁面與使用流程

### 頁面清單
```
/                       首頁（今日課表 + 待辦）
/students               學員列表
/students/[id]          學員詳細頁（總覽 + 子分頁）
  ├─ overview            總覽
  ├─ inbody              InBody 紀錄歷史 + 折線圖
  ├─ sessions            訓練紀錄歷史
  └─ weekly-plans        週計劃 / PDF 下載
/sessions/new           開始新一堂課
/sessions/[id]          上課中即時紀錄頁（核心 UI）
/sessions/[id]/done     結束課程，產生下週計劃
/weekly-plans/[id]      編輯下週計劃
/weekly-plans/[id]/preview  PDF 預覽
/exercises              動作主檔管理
/settings               設定（API key、規則參數、備份）
```

### 三個核心使用情境

**情境 1：新學員加入（10–15 分鐘）**
1. `/students` → 新增 → 填基本資料 + 目標 + 頻率
2. 跳到 InBody 子頁 → 新增 InBody 紀錄
3. 系統用規則產生「基本建議」（可編輯）
4. 安排第 1 堂課

**情境 2：上課中即時紀錄（核心 UI）**
- `/sessions/[id]` 顯示動作清單 + 每組的可編輯表格
- 重量自動繼承上組數字
- 系統顯示「上次同動作的最後一組」與「重量建議」（規則）
- RPE 1–10 滑桿、力竭勾選框
- **每改一格自動存**，斷線可恢復

**情境 3：產出下週 PDF（5–10 分鐘）**
1. 課堂頁按 [完成] → `/sessions/[id]/done`
2. 系統並行：規則算下次訓練菜單與走路步數 / 有氧；Gemini 產生飲食草稿與教練建議文
3. 跳到 `/weekly-plans/[id]` 編輯，7 天分頁切換
4. [預覽 PDF] → [下載 PDF] → 透過 LINE 等管道發給學員

### UI/UX 重點
- 大按鈕、大數字輸入框（適合戴運動手套操作）
- 自動儲存（無需顯式 Save）
- 軟刪除 + 30 天救援期
- AI 失敗降級：飲食留空 + 紅字提示，不阻塞流程

---

## 6. 建議引擎

### 規則 vs AI 分工

| 建議項目 | 來源 | 可編輯 |
|---------|------|--------|
| InBody 後的基本建議 | 規則 | ✅ |
| 下次訓練的肌群 | 規則 | ✅ |
| 下次每組的重量建議 | 規則 | placeholder 顯示 |
| 每日走路步數 / 有氧分鐘 | 規則 | ✅ |
| 每日飲食建議 | **AI（Gemini）** | ✅ |
| PDF 上「給學員的一段話」 | **AI（Gemini）** | ✅ |
| 每日補充小訓練 | 規則 + AI 補強 | ✅ |

### 規則細節

**R1. 下次訓練肌群（第 4 堂以後）**
- 增肌：三分化循環（胸→腿→背），優先補 InBody 部位肌肉量最弱者
- 減脂：推/拉/腿循環 + 大肌群多帶心率
- 體能：全身循環，每次挑 4 個動作

調整因子（皆以**該學員最近一次完成的 session** 為基準）：
- 上次該肌群平均 RPE > 8.5 → 降強度（換較輕動作或換肌群）
- 上次該肌群平均 RPE < 6 → 升強度
- `Student.weekly_class_count` = 1 → 全身性課表（一次帶三大肌群）
- `Student.weekly_class_count` = 2 → 上下肢分化
- `Student.weekly_class_count` ≥ 3 → 嚴格分化（單肌群為主）

**R2. 每組重量建議**
取**該學員**最近一次做過此動作的**最後一組** SetLog：
- RPE ≤ 7 且未力竭 → +5%（四捨五入到 2.5kg）
- RPE 8–9 → 持平
- RPE = 10 或力竭 → −5%
- 該學員從未做過此動作 → 不顯示建議（placeholder 留空）

**R3. 每日走路 / 有氧**
| 目標 | 步數 | 有氧 | 備註 |
|------|------|------|------|
| 增肌 | 5000–7000 | 0–15 | 上課日減半 |
| 減脂 | 8000–12000 | 20–40 | 看 BMI 決定上限 |
| 體能 | 8000–10000 | 15–30 | 平均分配 |

**R4. InBody 後基本建議模板**
- 體脂 > 警示閾值 且 目標增肌 → 「先減脂再增肌」
- BMR < 1300 → 「基礎代謝偏低，建議增肌提升代謝」
- 內臟脂肪 > 10 → 「優先處理內臟脂肪」

### AI 部分

**AI 1：每日飲食建議**
- 使用 Gemini `responseSchema`（結構化輸出）保證 JSON 格式
- Prompt 包含：學員基本資料、目標、體重 / 體脂、BMR、上課日 / 健身房日
- 輸出：7 天 × 4 餐
- 規則：上課日熱量 +10%、蛋白質維持 1.6g/kg

**AI 2：PDF 教練建議文（100–150 字）**
- Prompt 包含：本次訓練摘要、InBody 變化、目標進度
- 輸出語氣：專業、鼓勵、具體、提下週要點

**降級**：API 失敗時飲食留空 + 紅字提示，不阻塞流程

### 規則參數可調（`/settings`）
- 各目標的步數範圍
- 重量微調百分比
- 體脂警示閾值（男 / 女）
- AI prompt 模板

---

## 7. PDF 產生

### 結構（共 8 頁）
- **頁 1（封面 / 總覽）**：學員姓名、日期區間、本週訓練紀錄摘要、AI 教練建議文、InBody 對照、本週目標數字
- **頁 2–8（每天一頁）**：日期 + 星期幾 + 是否上課日、飲食（早午晚 + 點心）、運動目標（步數 + 有氧）、補充小訓練（含動作圖 + 組數）、水分目標、睡眠目標、教練提醒

### 技術
- `@react-pdf/renderer` 在 Next.js 伺服器端渲染
- 中文字型內建思源黑體
- 動作示範圖：MVP 從 wger 下載；教練可上傳自有圖片覆蓋
- 檔案儲存：`gym/data/pdfs/{student_id}/{weekly_plan_id}.pdf`
- 預設檔名：`{學員姓名}_第N週_YYYYMMDD-YYYYMMDD.pdf`
- 重新產生時舊檔保留（加日期後綴）

### 生成耗時
- 規則部分：< 100ms
- AI 部分：5–15s
- PDF 渲染：1–3s
- **總計約 10–20 秒，UI 顯示進度**

### 額外功能
- 複製檔案路徑到剪貼簿
- Finder 中 highlight 該檔
- LINE 分享功能延後

---

## 8. 運維

### 啟動 / 關閉
- 第一次安裝：`安裝.command`（檢查 Node.js、安裝相依、建空 db、預載 wger 動作）
- 每次使用：雙擊 `啟動健身管理.command` → 自動開瀏覽器
- 關閉：終端機 `Ctrl+C`
- 「假裝是 app」：Chrome 安裝為應用程式 + Dock 圖示，圖文教學見 README

### 備份
- 一鍵備份：`備份資料.command` → `~/Desktop/gym-backups/gym-YYYYMMDD-HHMMSS.db`
- 自動快照：每次啟動時保留最近 30 天每天的 `gym.db` 副本於 `gym/data/backups/`
- 選擇性 iCloud：使用者把 `gym/data/` 放在 iCloud Drive
- PDF 檔案存於 `gym/data/pdfs/`

### 錯誤處理
| 狀況 | 反應 |
|------|------|
| Gemini API 失敗 | 飲食 / 教練建議文留空，紅字提示，可手填 |
| 完成課程時無紀錄 | 跳警告，可選「結束」或「回去填」 |
| 誤刪學員 | 軟刪除 + 30 天救援頁面 |
| 並行編輯衝突 | 後存覆蓋前存，保留歷史紀錄 |
| `gym.db` 損壞 | 啟動時偵測，自動從最近備份還原 |
| Schema 升級 | 自動 migration，跑前先備份 |

### 測試策略
- **單元測試（Vitest）**：規則引擎所有規則
- **端對端測試（Playwright）**：核心情境（新增學員 → 上課紀錄 → 產 PDF）

### 部署演進（為未來鋪路，MVP 不做）
- Phase 2：部署 Vercel + 換 Turso（雲端 SQLite）
- 切換工作量：改一個環境變數 + 把 SQLite 檔案匯入 Turso
- 加 QR 學員自助頁（手動輸入心率）
- 加教練手機 RWD 微調

---

## 9. 開放議題（待實作前確認）

1. **「Student.goal」其他自訂值**：MVP 是否允許 `custom`，還是強制四選一以利規則套用？目前設計：允許 custom，規則套用時 fallback 到 `fitness`。
2. **wger 動作資料庫的授權**：實作前要確認可商用（雖然 MVP 不商用，但下一步是 SaaS）。
3. **動作示範圖**：wger 圖檔通常是 SVG / 動畫，PDF 中能否良好渲染需在實作初期驗證。
4. **預設動作清單**：要在實作期間決定預載哪 50–80 個動作。
5. **InBody 量測值的合理性檢查**：是否要在輸入時做範圍驗證（例如體脂率 > 50% 時警示）？

---

## 10. 後續步驟

1. 使用者審閱本 spec
2. 確認後進入 `writing-plans` skill，產生實作計劃
3. 實作計劃將以 vertical slice 方式分階段交付：
   - Slice 1：Student CRUD + InBody 紀錄
   - Slice 2：Session + Exercise + SetLog（核心紀錄頁）
   - Slice 3：規則引擎 + 重量建議
   - Slice 4：WeeklyPlan + AI 整合
   - Slice 5：PDF 產生
   - Slice 6：設定頁、備份、Polish

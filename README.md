# 健身教練管理 App

個人健身教練的學員管理 + 訓練紀錄 + 個人化計劃工具。

## Slice 1 已完成

- Next.js + SQLite + shadcn/ui 專案打底
- 學員 CRUD（新增、列表、詳細、編輯、軟刪除）
- InBody 紀錄（含進階欄位、歷史、單筆詳細）
- InBody 基本建議（規則 R4）
- 單元測試（Vitest）+ 端對端測試（Playwright）

## 一般使用

雙擊 `啟動健身管理.command`。

第一次會自動：
- 安裝相依套件
- 建立空資料庫

之後每次只是啟動。瀏覽器會自動打開 http://localhost:3000。

## 備份

雙擊 `備份資料.command`，會把 `data/gym.db` 複製到 `~/Desktop/gym-backups/`。

## 開發

```bash
npm install
npm run dev          # 啟動 dev server
npm test             # 跑單元測試
npm run test:e2e     # 跑端對端測試
npm run db:studio    # 視覺化看資料庫
```

## 文件

- 設計規格：`docs/superpowers/specs/2026-05-09-gym-coach-app-design.md`
- 實作計劃：`docs/superpowers/plans/`

## 路線圖

| Slice | 內容 | 狀態 |
|-------|------|------|
| 1 | 專案打底 + 學員 CRUD + InBody | 完成 |
| 2 | Session + Exercise + SetLog（核心紀錄頁） | 待辦 |
| 3 | 規則引擎 + 重量建議 | 待辦 |
| 4 | WeeklyPlan + AI 整合 | 待辦 |
| 5 | PDF 產生 | 待辦 |
| 6 | 設定頁、備份、Polish | 待辦 |

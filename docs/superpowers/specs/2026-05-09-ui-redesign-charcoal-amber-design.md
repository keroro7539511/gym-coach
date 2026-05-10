# UI 改版 — 暗炭灰 + 琥珀銅 (現代健身科技風)

- **日期**：2026-05-09
- **狀態**：Draft
- **基底**：MVP（commits 5ddc149..914835e）已上線，本 spec 為純視覺改版

---

## 1. 目標與限制

### 目標
把現有亮色預設樣式改成「暗炭灰 + 琥珀銅」的現代健身科技風。氣質參考：Equinox／高端工作室／Whoop 沉穩版。

### 不做的事（YAGNI）
- 不換 React 元件結構或 layout
- 不換 UI library（仍使用 shadcn `base-nova`）
- 不引入新依賴（不裝 framer-motion、不裝 icon library 之外的東西）
- 不做深淺主題切換（只做暗色）
- 不動 PDF 視覺（PDF 已是文件感，獨立風格）

### 受影響範圍
| 區域 | 動作 |
|------|------|
| `src/app/globals.css` | 改 CSS 變數定義（顏色、字型） |
| `tailwind.config` 或 globals.css 的 `@theme` | 加入新 tokens |
| Layout (`src/app/layout.tsx`) | 加 Inter + JetBrains Mono Google Fonts |
| Nav (`src/components/nav.tsx`) | 改 brand 樣式 |
| 全部頁面 | 微調 spacing/typography 適應深色 |
| 核心元件：`session-recorder`, `set-row`, `weekly-plan-editor`, `daily-plan-editor`, `student-form`, `inbody-form`, `settings-form`, `recommendation-card` | 改樣式 |

---

## 2. 設計 Tokens

以 CSS variables 形式寫在 `globals.css` 的 `:root`（替換 shadcn 預設）。

### 顏色（OKLCH 或 hex 皆可，這裡以 hex 表達）

```
--background:        #0a0a0a   (page root)
--surface-1:         #0e0e0e   (content背景)
--surface-2:         #161616   (cards)
--surface-3:         #1f1f1f   (hover/nested)

--border:            #2a2a2a
--border-subtle:     #1f1f1f
--border-strong:     #3a3a3a

--foreground:        #ededed   (primary text)
--muted-foreground:  #888888
--disabled:          #555555

--accent:            #f59e0b   (amber)
--accent-hover:      #d97706
--accent-foreground: #0e0e0e   (text on amber buttons)

--success:           #10b981
--warning:           #f59e0b   (=accent)
--destructive:       #ef4444
--info:              #3b82f6

--ring:              #f59e0b   (focus ring)
```

### shadcn 變數對映

shadcn `base-nova` 的 CSS variables 用 OKLCH。我們改寫成上面的色票。對映關係：

| shadcn var | new value |
|------------|-----------|
| `--background` | `#0a0a0a` |
| `--foreground` | `#ededed` |
| `--card` | `#161616` |
| `--card-foreground` | `#ededed` |
| `--popover` | `#161616` |
| `--popover-foreground` | `#ededed` |
| `--primary` | `#f59e0b` |
| `--primary-foreground` | `#0e0e0e` |
| `--secondary` | `#1f1f1f` |
| `--secondary-foreground` | `#ededed` |
| `--muted` | `#1f1f1f` |
| `--muted-foreground` | `#888888` |
| `--accent` | `#1f1f1f` |
| `--accent-foreground` | `#f59e0b` |
| `--destructive` | `#ef4444` |
| `--destructive-foreground` | `#ededed` |
| `--border` | `#2a2a2a` |
| `--input` | `#2a2a2a` |
| `--ring` | `#f59e0b` |

> **註：** shadcn 的 `--accent` 跟我們設計上的「強調色」概念不同 — shadcn 的 `--accent` 是 hover/highlight 的次表面色，我們的 `accent`（琥珀）對應到 shadcn 的 `--primary`。

### 字型

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Noto Sans TC', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
```

從 Google Fonts 載 Inter（latin）和 JetBrains Mono（latin）。中文 fallback 走系統字型即可（Mac 上會用 PingFang TC）。

### Spacing / Radius

| Token | Value | 用途 |
|-------|-------|------|
| `--radius` | `10px` | 主要圓角（卡片、按鈕、input） |
| `--radius-sm` | `6px` | 小元件（badge、輸入框） |
| `--radius-lg` | `14px` | 容器、modal |

Tailwind 的 spacing 沿用預設（4px 倍數），不調整。

---

## 3. 元件樣式規則

### 3.1 標題與數字

```
.h1 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
}
.h2 {
  font-size: 20px;
  font-weight: 700;
}
.metric-num {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1;
}
.metric-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--muted-foreground);
}
.metric-suffix {
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
  margin-left: 4px;
}
```

### 3.2 大寫標籤（uppercase mono labels）

用在 metadata：「LIVE」「RPE」「組」「肌群」這類短字。
- `text-xs` (12px)、`font-weight: 700`、`letter-spacing: 1.5px`、`text-transform: uppercase`

### 3.3 狀態徽章（badge）

兩種變體：

**邊框式（預設）**
```css
.badge-outline {
  display: inline-block;
  border: 1px solid currentColor;
  color: var(--accent);  /* or other status color */
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}
```

**填底式（強調，用在 dashboard live status）**
```css
.badge-solid {
  background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3);
  color: var(--accent);
  ...同上 padding/font...
}
```

### 3.4 按鈕分級

| 級別 | 範例 | 樣式 |
|------|------|------|
| Primary | 完成課程、儲存設定 | `bg-amber-500 text-stone-950 font-bold uppercase tracking-wider` |
| Secondary | 繼續、編輯 | `border border-zinc-700 hover:border-amber-500 hover:text-amber-500` |
| Ghost | 刪除動作 | `text-zinc-500 hover:text-rose-500 bg-transparent` |
| Danger | 刪除學員 | `text-rose-500 hover:underline` |

### 3.5 卡片

```css
.card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}
```

### 3.6 數字輸入框（核心紀錄頁）

```css
.numeric-input {
  background: var(--surface-1);
  border: 1px solid var(--border);
  color: var(--foreground);
  padding: 8px 10px;
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  width: 80px;
  transition: outline-color 100ms;
}
.numeric-input:focus {
  outline: 2px solid var(--accent);
  border-color: var(--accent);
}
```

### 3.7 表格樣式（組數、學員列表、weekly plan list）

- thead 用大寫小字標籤樣式
- 每 row 下緣加 `--border-subtle` 的 1px 線
- 最後一行不加底線
- hover row 微微提亮（`background: rgba(255,255,255,0.02)`）

### 3.8 自訂元件

- **SetNumber 圓圈**：核心紀錄頁的「組」欄。32×32 圓、`--surface-3` 底、琥珀色等寬數字
- **Recording status pulse**：進行中徽章左側一個發光小圓點，1.5s 呼吸動畫
- **Recommendation card**：依 `severity` 改色（info=藍、warn=琥珀、alert=紅）— 用 10% 透明度的對應色作 background，1px 邊

---

## 4. 頁面細項

### 4.1 Nav（`src/components/nav.tsx`）

```
GYM·COACH      學員 · 動作主檔 · 設定
```

- Brand 用大寫 + letter-spacing 2px、`·` 與右側用琥珀色
- 選中的 link 用琥珀色 + font-weight 600
- 高度 56px、底部 1px `--border-subtle`

### 4.2 首頁 dashboard

- `h1` 用 28px font-weight 800
- 三個 Card 排成「進行中課程（寬）+ 學員數 / 本週產出（兩個小卡）+ 最近週計劃（寬）」
- 進行中課程 Card 標題加 LIVE pulse badge（如果有進行中）
- 學員數用 metric-num 樣式

### 4.3 核心紀錄頁（最重要）

按 brainstorm mockup 實作：
- Header：學員名 28px 800、Session 用 mono 數字 + 琥珀色
- Recording 徽章右上、pulse 動畫
- 動作卡：每張獨立 Card、頂部動作名 + 肌群 tag + 重量建議 hint
- 表格欄位：組（圓圈）/ 重量 / 次數 / RPE / 力竭 / 心率 / 刪除
- 「+ 新增一組」用 dashed border 樣式、hover 變琥珀
- 「+ 新增動作」同樣 dashed border
- 完成課程按鈕：右下、Primary、大寫字

### 4.4 WeeklyPlan 編輯頁

- 7 天 Tabs 用 segmented control 樣式：未選為 `--surface-2`、選中為琥珀色底 + dark text
- 上課日 tab 多一個小琥珀點
- 每天的內容 in Card

### 4.5 Settings 頁

- 三個 section 用 `--border-subtle` 分隔
- 每個 section h3 用大寫小字標籤樣式
- AI prompt textarea 用 mono font + `--surface-1` 底色

---

## 5. 實作策略

按以下順序，每步可獨立 commit：

1. **CSS variables 定義** — 改 `globals.css`，建立所有 token
2. **Google Fonts 載入** — 在 layout.tsx 加 Inter + JetBrains Mono
3. **shadcn 變數覆寫** — 把 base-nova 的預設替換成我們的色票
4. **Nav 元件改版** — 含 brand 大寫、links 樣式
5. **首頁 dashboard** — 套用 metric 樣式
6. **核心紀錄頁** — 最重要，套用所有元件規則
7. **學員相關頁面** — 列表、詳細、編輯、軟刪除頁
8. **InBody 表單與詳細頁** — 套用 recommendation card 新樣式
9. **WeeklyPlan 編輯頁** — Tabs segmented、Cards
10. **Settings 頁** — section 分隔
11. **微調與全頁巡檢** — 一頁一頁開過去看，修小細節

---

## 6. 開放議題

1. **「Inter + Noto Sans TC」混排在中英混雜的標題**：Inter 字幅較窄、Noto TC 較寬，有時會看起來不齊。先信任系統 fallback；如果不行再加 `font-feature-settings`。
2. **動畫加多少**：MVP 只加 recording pulse 與 focus ring transition。其他互動（hover transform、按鈕 scale-on-press）先不做。
3. **Mobile RWD**：本 spec 仍以 desktop 為主。Tabs `grid-cols-7` 在 < 800px 會擠，但 MVP 不修。

---

## 7. 後續

實作後預期：
- 全站視覺一致地呈現暗炭灰 + 琥珀銅
- 字體與密度符合 brainstorm 通過的 mockup
- shadcn 既有元件不需重寫，只透過 CSS 變數重著色
- 既有的 49 unit + 1 e2e tests 不會壞（純視覺改動）

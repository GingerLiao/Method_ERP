# 美瑟進銷存 AI 平台 — Method ERP

美瑟科技的進、銷、存整合平台，涵蓋 **採購（進）／銷售（銷）／庫存（存）／BOM 物料清單／生產工單**，並結合 **Claude AI** 提供智慧補貨預測與自然語言輸入助手。

> 靈感參考 [ECOUNT BOM 物料清單](https://www.ecount.com/tw/ecount/product/production_bill-of-material-software)，並延伸為完整的進銷存 + AI 平台。

---

## ✨ 核心功能

| 模組 | 功能 |
| --- | --- |
| **儀表板** | 庫存總值、近 30 天進銷趨勢圖、補貨警示、待處理單據 |
| **商品 / 庫存（存）** | 商品主檔、分類、即時庫存、庫存異動總帳、盤點調整 |
| **採購（進）** | 供應商管理、採購單、確認 / 入庫（自動增加庫存與異動紀錄） |
| **銷售（銷）** | 客戶管理、銷售單、出貨（自動扣庫、庫存不足檢查） |
| **BOM 物料清單** | 成品用料結構、損耗率、**多階展開**、標準成本自動roll-up |
| **生產工單** | 依 BOM 展開用料需求、庫存足量檢查、完工自動扣料 + 成品入庫 |
| **🤖 AI 智慧補貨** | 分析歷史消耗趨勢，計算可用天數，Claude 給出補貨優先順序與理由 |
| **✨ AI 輸入助手** | 一句話建立商品（自然語言→結構化欄位）、自然語言查詢營運數據 |

---

## 🛠 技術棧

- **Next.js 14**（App Router）+ **TypeScript**
- **Prisma ORM** + **PostgreSQL**（雲端多人共用，推薦 Neon）
- **Tailwind CSS** — UI 樣式
- **Recharts** — 圖表
- **Google Gemini / Anthropic Claude API** — AI 功能（可切換）
- **Zod** — API 輸入驗證

---

## 🚀 快速開始

```bash
# 1. 安裝套件
npm install

# 2. 設定環境變數
cp .env.example .env
#   填入 DATABASE_URL（Neon 免費 PostgreSQL 連線字串）
#   要用 AI 功能，再填 GEMINI_API_KEY（免費）或 ANTHROPIC_API_KEY

# 3. 一鍵初始化資料庫（generate + 建表 + 匯入示範資料）
npm run setup

# 4. 啟動開發伺服器
npm run dev
#   開啟 http://localhost:3000
```

> 需要免費的雲端資料庫連線字串？到 <https://neon.tech> 註冊 → 建立專案 → 複製 Connection string。部署步驟見 [DEPLOY.md](./DEPLOY.md)。

### 常用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 開發模式 |
| `npm run build` / `npm run start` | 正式建置 / 啟動 |
| `npm run db:seed` | 匯入示範資料 |
| `npm run db:reset` | 清空並重建示範資料 |
| `npm run db:studio` | 開啟 Prisma Studio 檢視資料 |

---

## 🤖 啟用 AI 功能

系統支援兩種 AI 供應商，會依你在 `.env` 填的金鑰**自動選擇**：

### 選項 A：Google Gemini（免費，推薦先用）

```env
GEMINI_API_KEY="AIza..."
GEMINI_MODEL="gemini-2.0-flash"
```

金鑰申請：<https://aistudio.google.com/apikey>（用 Google 帳號登入即可，免信用卡、有免費額度）

### 選項 B：Anthropic Claude（需付費儲值）

```env
ANTHROPIC_API_KEY="sk-ant-..."
ANTHROPIC_MODEL="claude-sonnet-4-20250514"
```

金鑰申請：<https://console.anthropic.com/>

> 兩把金鑰都填時，可用 `AI_PROVIDER="gemini"` 或 `"anthropic"` 指定；未指定則優先 Gemini。
> **未設定任何金鑰**時，「智慧補貨」仍會以統計基準（日均消耗、可用天數）運作；「AI 輸入助手」則需要金鑰。

---

## ☁️ 部署到雲端

完整步驟（Vercel + Neon，含「push 自動更新」說明）請見 **[DEPLOY.md](./DEPLOY.md)**。

---

## 📁 專案結構

```
src/
├── app/
│   ├── page.tsx              # 儀表板
│   ├── products/ …           # 商品
│   ├── inventory/ …          # 庫存查詢 / 異動
│   ├── purchasing/ …         # 採購（進）
│   ├── sales/ …              # 銷售（銷）
│   ├── bom/ …                # BOM 物料清單
│   ├── production/ …         # 生產工單
│   ├── ai/ …                 # AI 補貨 / 輸入助手
│   └── api/ …                # 所有後端 API 路由
├── components/               # 共用 React 元件
└── lib/
    ├── db.ts                 # Prisma client
    ├── inventory.ts          # 庫存異動核心（單一入口）
    ├── bom.ts                # BOM 多階展開與成本計算
    ├── replenishment.ts      # 補貨統計基準
    └── ai.ts                 # Claude API 封裝
prisma/
├── schema.prisma            # 資料模型
└── seed.ts                  # 示範資料
```

---

## 💡 設計重點

- **庫存一致性**：所有進出貨、調整、生產耗料都透過 `applyStockMovement()` 單一入口，同時寫入異動總帳並更新即時庫存，確保帳實相符。
- **BOM 多階展開**：`explodeBom()` 遞迴展開半成品，含損耗率與循環參照防呆，供生產扣料與成本 roll-up 使用。
- **AI 混合式**：先用確定性演算法算出需求基準，再交給 Claude 做趨勢判讀與優先排序，兼顧可靠與智慧。

---

美瑟科技 © 2026

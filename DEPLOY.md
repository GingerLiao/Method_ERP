# 部署指南：Vercel + Neon

把美瑟進銷存平台部署到雲端，讓公司同事用網址就能連進來。全程免費起步，而且**部署後每次 `git push` 會自動更新網站**。

架構：**Vercel**（跑網站）＋ **Neon**（雲端 PostgreSQL 資料庫）。

---

## 步驟 1：建立雲端資料庫（Neon）

1. 前往 <https://neon.tech> → 用 GitHub 帳號註冊登入
2. 點 **Create project**（專案名稱隨意，例如 `method-erp`；地區選離台灣近的，如 Singapore）
3. 建好後，在 **Dashboard → Connection string** 複製那串連線字串，長得像：
   ```
   postgresql://xxxx:xxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
   > 記得結尾要有 `?sslmode=require`。先貼到記事本備用。

---

## 步驟 2：部署到 Vercel

1. 前往 <https://vercel.com> → 用 **GitHub 帳號**登入
2. 點 **Add New… → Project**
3. 找到你的 repo **`Method_ERP`** → 點 **Import**
4. 在設定畫面：
   - **Root Directory**：保持根目錄（不用改）
   - **Framework Preset**：會自動偵測為 **Next.js**（不用改）
   - 展開 **Environment Variables**，加入以下變數：

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | 步驟 1 複製的 Neon 連線字串 |
   | `GEMINI_API_KEY` | 你的 Gemini 金鑰（要用 AI 才需要） |
   | `GEMINI_MODEL` | `gemini-2.0-flash` |

5. 點 **Deploy**，等待 1～3 分鐘

> 建置時會自動 `prisma db push` 幫你在 Neon 建好所有資料表，不用手動建。

部署完成後，Vercel 會給你一個網址（例如 `https://method-erp.vercel.app`），打開就是你的系統 🎉

---

## 步驟 3：（選用）匯入示範資料

剛部署的資料庫是**空的**。若想先放示範資料看看：

在你**本機**的專案資料夾，把 `.env` 的 `DATABASE_URL` 改成 Neon 那條，然後執行：

```bash
npm run db:seed
```

之後重新整理網站就會看到示範商品與單據。（正式使用時就不用這步，直接在系統裡建自己的資料。）

---

## 部署後還能調整嗎？可以，而且很簡單

Vercel 已經跟你的 GitHub 綁定。之後任何修改：

```
改程式 → git push → Vercel 自動偵測 → 幾分鐘後網站自動更新
```

- 你（或我）push 到 `main` 分支 → 正式網站自動更新
- push 到其他分支 → Vercel 會給一個「預覽網址」讓你先測，確認 OK 再合併

所以想加功能、改文字、修 bug，都不用重新部署，push 就好。

> 目前程式碼在 `claude/inventory-management-ai-bmc57h` 分支。建議先在 GitHub 上開 Pull Request 合併到 `main`，讓 `main` 成為正式版來源。需要我幫你開 PR 就說一聲。

---

## 常見問題

**Q：Neon / Vercel 免費夠用嗎？**
內部小團隊試用完全夠。Neon 免費方案有一定的儲存與運算額度，Vercel 免費方案適合非商業/內部使用。用量變大再升級即可。

**Q：改了資料庫結構（schema）會怎樣？**
下次 `git push` 部署時會自動同步到 Neon。若是「刪除欄位」這類破壞性變更，建置會停下來提醒你，避免誤刪資料。

**Q：本機開發也要連 Neon 嗎？**
是的，本機 `.env` 的 `DATABASE_URL` 也填 Neon 那條即可（本機和雲端共用同一個資料庫）。若想本機用獨立資料庫，可在 Neon 另開一個 project 當測試用。

**Q：金鑰會外流嗎？**
不會。金鑰只存在 Vercel 的環境變數與你本機的 `.env`（已被 `.gitignore` 排除），不會進到 GitHub。

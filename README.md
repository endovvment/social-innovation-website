第一次預覽或編輯作品，請先看[修改網站教學](./修改網站教學.md)。

# 新創會社官方網站

這是「地球案件檔案館」的本機桌面版。作品與平台連結可直接用文字編輯器更新。公開頁面的文案及版權以品牌方核可的內容為準。

## 在電腦上開啟

1. 用檔案總管開啟專案的 `website` 資料夾，按右鍵選「在終端機中開啟」。
2. 新電腦第一次使用時，安裝 Node.js 20.9 以上版本，再執行 `npm ci`。目前這份工作區已安裝套件。
3. 執行 `npm run dev`，在桌面瀏覽器打開 [http://localhost:3000](http://localhost:3000)。

若 PowerShell 阻擋 npm 指令，將 `npm` 換成 `npm.cmd`，例如 `npm.cmd run dev`。終端機輸出「Ready」後即可瀏覽。若網址被其他程式占用，可改用 `npm run dev -- --port 3001`，再打開 [http://localhost:3001](http://localhost:3001)。

## 新增或修改作品

1. 到 `src/content/works`，複製一部最接近的 Markdown 檔。檔名用四位數案號和英文小寫，例如 `0004-time-bank.md`。
2. 將案號、標題和 `slug` 各改成新的唯一值。網址由 `slug` 決定，作品已公開後請保留這個值。
3. 更新簡介、議題、封面及媒體連結。保留首尾兩行 `---`。簡介每段開頭空兩格，中間可留一行空白。發布版請填 `published`，仍在製作請填 `in-production`。
4. 存檔後重新整理作品庫。若開發版暫時顯示舊資料，按 Ctrl+C 停止伺服器，再執行 `npm run dev`。

以下是既有《滴答銀行》的完整格式示例。複製時換成新作品的真實資料。

```yaml
---
caseNo: "0004"
title: 滴答銀行
slug: time-bank
status: published
topics: [時間銀行, 互助經濟]
tagline: 在人人都有時間的城市，有人願意用一小時陪你散步嗎？
synopsis: |-
  滴答城的機器負責生產，一顆超級食物就能吃飽。舒克可以在元宇宙裡當國王、征服火星，卻找不到一個人共進一頓真實的晚餐。

  城裡開了一間以時間為單位的銀行。幫別人一小時，就能換來另一個人的一小時。舒克想不出自己有什麼特長，只先選了一件看似簡單的事：陪一位退休教授散步。
issueNote: 若每個人的一小時都同樣珍貴，社區如何辨認原本被忽略的照護、陪伴和技能？
cover: /assets/cover-0004.webp
podcastCover: /assets/story-0004.webp
podcastAnalysisCover: /assets/analysis-0004.webp
youtubeId: UncfEbeHLe4
# podcastStoryUrl: 填正式故事單集網址
# podcastAnalysisUrl: 填正式解析單集網址
# ebookUrl: 填實際商品購買網址
# isbn: "填正式 ISBN"
# publishedAt: "YYYY-MM-DD"
featured: true
---
```

- **換封面**。把可公開的 16:9 封面另存為 WebP，長邊約 1,680 像素，放到 `public/assets`。在作品檔填 `cover: /assets/封面檔名.webp`。兩種 Podcast 封面用正方形，對應 `podcastCover` 和 `podcastAnalysisCover`。
- **填 YouTube**。從觀看網址的 `v=` 後面取 11 個字元，貼到 `youtubeId`。同一作品的故事版或解析版可照 0001 的 `youtubeExtra` 格式填寫。
- **填 Podcast**。網站用 Apple Podcasts 的單集標題找對應的作品。作品改名時，可保留原本的 `podcastStoryUrl` 和 `podcastAnalysisUrl`，協助比對。目錄查不到單集時，會提供 Apple Podcasts 節目入口。
- **填電子書**。正式購買網址填 `ebookUrl`。ISBN 以引號括起來。購買按鈕只在有正式網址時出現。
- **調整精選**。在作品檔填 `featured: true`。YouTube RSS 暫時取不到時，首頁會選案號最前的一部精選作品。

## 管理平台與聯絡

品牌、平台及公用信箱放在 `src/config/site.ts`。Facebook、Instagram、Threads 目前會顯示在聯絡頁與頁尾，由 `showSocial` 控制。若要顯示創辦人照片，可把核可照片轉成 WebP 放入 `public/assets`，再填 `founderPortrait` 路徑。

伺服器約每小時更新 YouTube RSS 與 Apple iTunes Lookup 目錄。YouTube 暫時無法讀取時，首頁使用作品檔的精選設定。涉及發布日期的欄位以已取得的來源或手填日期為準。

公用信箱由 `site.contact.email` 設定。聯絡頁顯示完整地址和「寄信給我們」、「複製信箱」，啟用表單後這些入口仍可使用。要啟用表單，先複製 `.env.example` 為 `.env.local`，填入伺服器憑證後重啟。

```dotenv
RESEND_API_KEY=你的私密金鑰
CONTACT_TO_EMAIL=實際收件地址
CONTACT_FROM_EMAIL=Resend 已驗證的寄件地址
```

將金鑰保留在本機設定或主機的秘密欄位。實際寄送需先啟用 Resend 並驗證寄件網域。聯絡頁目前可用 Email 和官方平台。表單限速在同一個伺服器程序內生效。正式使用多實例主機前，應另核對代理的 IP 標頭及共用限速需求。

## 正式版與截圖

執行 `npm run build`，成功後執行 `npm start`。開發版若已占用 3000，先停止它，或啟動另一個埠。執行 `npm run check` 可檢查 TypeScript。

`screenshots/` 保存本輪 1440px 與 390px 的全頁畫面，手機檔名為 `-mobile`。`screenshots/banners/` 是各頁 Banner 的兩種寬度，`screenshots/motion/` 是各種天空和減少動態模式的連續影格。檔名後綴 `-1024` 對應第二輪保留的 1024px 畫面。

網站運行時可用 `npm run screenshots` 重拍，腳本先使用已安裝的 Playwright Chromium，其次嘗試本機 Chrome 或 Edge。若用不同埠，可在 PowerShell 先設 `$env:PREVIEW_URL='http://127.0.0.1:3001'`。

改名或更新標語後，可在 PowerShell 設定 `$env:SCREENSHOT_GROUP='share'` 再執行 `npm run screenshots`，從首頁畫面更新 1200×630 分享預覽圖。

## 日後部署

1. 優先用本機正式版指令驗收。若準備發布，將核可的正式網址填入環境變數 `SITE_URL`，以便產生正式 Sitemap 和分享連結。
2. 若要嘗試免費主機，先核對 Cloudflare Workers Free 額度。在網站副本依 Cloudflare 官方 Next.js 指南配置 vinext 或相容的 OpenNext 轉接，於轉接環境測試本機正式版、RSS、圖片及表單。轉接和雲端部署仍需另做驗收。[Cloudflare Next.js 指南](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) · [Workers 費率與額度](https://developers.cloudflare.com/workers/platform/pricing/)
3. 若選 Vercel，專案根目錄設為 `website`，框架選 Next.js，再加入必要的環境變數。品牌商業站應核對商用方案。Vercel Hobby 限個人非商業用途。[Vercel Hobby 方案](https://vercel.com/docs/plans/hobby)
4. 發布前核對公開素材、官方信箱、表單寄件設定與兩份政策範本。正式部署及測試郵件依品牌方核准安排。

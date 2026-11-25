import Link from "next/link";
import { NightSky } from "@/components/night-sky";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("隱私權政策", "新創會社網站的資料處理與第三方影音說明。", "/privacy");

export default function PrivacyPage() {
  return <>
    <header className="page-mast dark-section sky-banner legal-banner">
      <NightSky variant="privacy" />
      <div className="site-width narrow">
        <p className="eyebrow">網站政策 · 範本</p><h1>隱私權政策</h1>
        <p className="legal-date">最後更新：2026 年 11 月 24 日</p>
      </div>
    </header>
    <article className="site-width narrow section-space legal">
    <h2>合作洽詢</h2>
    <p>聯絡表單啟用後，新創會社會使用你主動提供的姓名、職稱、機構、聯絡資料及合作說明，以回覆及處理這次洽詢。資料由承辦人及寄送服務在此範圍內處理，保留至洽詢與必要的後續處理完成。</p>
    <h2>影音與外部連結</h2>
    <p>播放嵌入影片或開啟外部平台時，平台可能依其政策處理裝置及連線資訊。開啟外部服務前，可參考該平台的隱私政策。</p>
    <h2>聯絡及資料請求</h2>
    <p>若對資料使用有疑問，或希望查詢、更正、停止使用或刪除所提供的洽詢資料，可透過<Link href="/contact#inquiry">聯絡頁</Link>的官方管道提出。</p>
    </article>
  </>;
}

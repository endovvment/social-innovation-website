import Link from "next/link";
import { NightSky } from "@/components/night-sky";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("使用條款", "新創會社官方網站的內容使用、作品授權與外部服務說明。", "/terms");

export default function TermsPage() {
  return <>
    <header className="page-mast dark-section sky-banner legal-banner">
      <NightSky variant="terms" />
      <div className="site-width narrow">
        <p className="eyebrow">網站政策 · 範本</p><h1>使用條款</h1>
        <p className="legal-date">最後更新：2026 年 11 月 24 日</p>
      </div>
    </header>
    <article className="site-width narrow section-space legal">
    <h2>作品及品牌識別</h2>
    <p>作品、圖像、影音、文案及品牌識別的權利由相關權利人保留。歡迎分享公開作品連結。教學散布、改作、出版或商業使用前，請依授權範圍辦理並向權利人確認。</p>
    <h2>外部平台與購買</h2>
    <p>影音在各平台的上架與播放受該平台的服務條件約束。外部商店的價格、交付、退款及使用條件，以商店正式商品頁與交易說明為準。</p>
    <h2>內容許可</h2>
    <p>如需企業合作或教育授權，請參考<Link href="/collaborate#license">合作方式</Link>，再透過官方聯絡入口說明用途。</p>
    </article>
  </>;
}

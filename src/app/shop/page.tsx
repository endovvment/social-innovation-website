import Link from "next/link";
import { NightSky } from "@/components/night-sky";
import { pageMeta } from "@/lib/meta";
import { getWorks } from "@/lib/works";

export const metadata = pageMeta("數位商城", "瀏覽電子繪本出版資訊。公開的購買連結會顯示在相關作品及商城。", "/shop");

export default function ShopPage() {
  const works = getWorks().filter((work) => work.status === "published");
  return <>
    <section className="page-mast dark-section sky-banner">
      <NightSky variant="shop" />
      <div className="site-width">
        <p className="eyebrow">數位商城</p><h1>{works.some((work) => work.ebookUrl) ? "電子繪本" : "電子繪本即將上架"}</h1>
        <p>電子繪本籌備中。下方可查閱原創作品及已上架的購買資訊。</p>
      </div>
    </section>
    <section className="site-width section-space">
      <h2>原創繪本目錄</h2>
      <div className="shop-list">{works.map((work) => <article key={work.caseNo} className="shop-row">
        <Link className="shop-work" href={`/works/${work.slug}`}>
          <span className="mono">CASE {work.caseNo}</span><h3>{work.title}</h3>
        </Link>
        {work.ebookUrl ? <a className="button button-ink" href={work.ebookUrl} target="_blank" rel="noopener noreferrer">購買電子繪本</a>
          : <span className="edition-status">籌備中</span>}
      </article>)}</div>
    </section>
  </>;
}

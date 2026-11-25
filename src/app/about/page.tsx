import Image from "next/image";
import Link from "next/link";
import { NightSky } from "@/components/night-sky";
import { TitlePhrases } from "@/components/title-phrases";
import { site, values } from "@/config/site";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta("關於新創會社", site.description, "/about");

export default function AboutPage() {
  return <>
    <section className="about-hero dark-section sky-banner">
      <NightSky variant="about" />
      <div className="site-width">
        <p className="eyebrow">關於新創會社</p>
        <h1 className="phrase-lines"><TitlePhrases phrases={["從一個人的遭遇，", "看見一群人的處境。"]} /></h1>
        <p>{site.slogan}</p>
      </div>
    </section>
    <div className="site-width section-space prose">
      <section id="brand-story">
        <h2>品牌故事</h2>
        <p>一個時代的樣貌，藏在人們如何生活、如何受困，又如何尋找出路的故事裡。新創會社透過繪本、影音敘事、數位出版及議題解析，把複雜的社會問題說成能理解、感受與思考的故事。</p>
        <p>我們相信教育可以走出教室，知識也能走進日常。從一個人的處境出發，探問社會結構、制度設計與價值選擇，並探索改變的可能性。</p>
      </section>
      <section className="about-pair">
        <div><h2>使命</h2><p>降低社會議題的理解門檻，促進公眾思辨、社會關懷與創新行動。</p></div>
        <div><h2>願景</h2><p>成為具有國際視野與社會影響力的原創社會教育品牌，讓知識透過故事傳播，讓創新透過理解發生。</p></div>
      </section>
      <section>
        <h2>五項核心價值</h2>
        <dl className="values-list">{values.map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}</dl>
      </section>
      <section className="founder-section">
        {site.founderPortrait && <Image src={site.founderPortrait} alt={site.founder} width={280} height={350} className="founder-portrait" />}
        <p className="eyebrow">創辦人</p><h2>{site.founder}</h2>
        <p className="founder-role">原創社會教育繪本作家 · 跨媒體內容創作者</p>
        <p>長期關注社會教育、社會創新、公共議題與制度發展，探索教育、科技、藝術及社會之間的連結。創立新創會社，源於如何讓艱深的社會議題走進一般人生活的追問。</p>
        <blockquote>我希望創作的不只是一本本繪本，而是一扇扇理解社會的窗口。</blockquote>
      </section>
      <section>
        <h2>一個故事如何完成</h2>
        <ol className="process-list">{["議題研究", "原創劇本創作", "AI 輔助視覺與影音", "多平台發布"].map((step) => <li key={step}>{step}</li>)}</ol>
        <Link className="button button-ink" href="/works#archive-filters">瀏覽原創作品</Link>
      </section>
    </div>
  </>;
}

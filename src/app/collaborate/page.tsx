import Image from "next/image";
import Link from "next/link";
import { Reveal, Timeline } from "@/components/motion";
import { NightSky } from "@/components/night-sky";
import { TitlePhrases } from "@/components/title-phrases";
import { contactUrl, site } from "@/config/site";
import { pageMeta } from "@/lib/meta";
import { getWorks } from "@/lib/works";

export const metadata = pageMeta("企業與教育合作", "透過客製繪本、影音敘事及內容授權，將金融素養、教育與 ESG 議題轉化為故事。", "/collaborate", "/assets/cover-0009.webp");

const services = [
  { title: "企業客製化數位繪本", detail: "從受眾與議題出發，研究內容、發展角色、寫作故事，再製作可發布的數位繪本。", example: "0001" },
  { title: "企業影音繪本", detail: "將故事轉為適合線上觀看與活動播放的影音內容，依專案規劃畫面、配音、字幕與配樂。", example: "0004" },
  { title: "社會教育與 ESG 專案", detail: "以故事與延伸解析傳達金融教育、防詐、社會共融與公益倡議中較難說清楚的議題。", example: "0009" },
  { title: "教育教材開發", detail: "結合故事、問題引導與討論材料，依教學目標設計可於課堂或工作坊使用的內容。", example: "0002" },
  { title: "既有作品與 IP 授權", detail: "依用途、受眾及發布範圍討論既有作品的教育、公益、出版或商業授權。", example: "0007", anchor: "license" },
  { title: "企業議題贊助", detail: "以專案方式支持公共議題的原創內容研究、故事製作與傳播，合作範圍由雙方確認。", example: "0005" },
];

const steps = [
  { title: "需求洽詢", detail: "確認合作對象、議題、目標受眾及希望完成的內容。" },
  { title: "議題研究", detail: "整理背景、溝通需求與可用素材，確認故事要回答的問題。" },
  { title: "創意提案與報價", detail: "提出內容形式、創作方向、交付項目與時程。" },
  { title: "合約與授權", detail: "確認製作範圍、審閱方式、發布及使用權限。" },
  { title: "製作", detail: "依提案進行劇本、視覺、影音或教材製作。" },
  { title: "審閱修改", detail: "依約定的審閱節點核對內容、效果及交付規格。" },
  { title: "交付驗收", detail: "按約定提供成品、檔案與使用說明。" },
];

export default function CollaboratePage() {
  const works = getWorks();
  return <>
    <section className="collaborate-hero dark-section sky-banner">
      <NightSky variant="collaborate" />
      <div className="site-width collaborate-layout">
        <div>
          <p className="eyebrow">企業、教育與公益合作</p>
          <h1 className="phrase-lines"><TitlePhrases phrases={["讓複雜的議題，", "成為深入人心的故事。"]} /></h1>
          <p>結合議題研究、原創敘事與多媒體製作，將金融素養、社會共融與公共議題帶進受眾理解得了的情境。</p>
          <a className="button button-ice" href="#services">瀏覽合作方式</a>
        </div>
      </div>
    </section>
    <section className="site-width section-space">
      <div className="section-heading"><h2>適合的合作對象</h2></div>
      <ul className="partner-list">{["銀行與金融機構", "保險公司", "科技與電信企業", "公益基金會與非營利組織", "社會企業", "學校及大專院校", "政府機關", "有 ESG 或企業社會責任需求的組織"].map((name) => <li key={name}>{name}</li>)}</ul>
    </section>
    <section id="services" className="services-section section-space">
      <div className="site-width">
        <div className="section-heading">
          <div><p className="eyebrow">專案洽詢</p><h2>六種合作方式</h2></div>
          <p>以下使用新創會社的原創作品，示例不同題材的敘事方式。</p>
        </div>
        <div className="services-list">{services.map((service, index) => {
          const work = works.find((item) => item.caseNo === service.example);
          return <Reveal key={service.title}>
            <article id={service.anchor} className="service-row">
              <span className="mono service-number">{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{service.title}</h3><p>{service.detail}</p></div>
              {work && <Link className="service-reference" href={`/works/${work.slug}`}>
                {work.cover && <div><Image src={work.cover} alt={`《${work.title}》封面`} fill sizes="230px" /></div>}
                <span>原創作品 · 《{work.title}》</span>
              </Link>}
            </article>
          </Reveal>;
        })}</div>
      </div>
    </section>
    <section className="site-width section-space deliverables">
      <h2>我們能交付什麼</h2>
      <ul className="partner-list">{["數位繪本", "影音繪本（配音、字幕、配樂）", "有聲故事", "Podcast 議題解析", "電子書"].map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
    <section id="process" className="timeline-section section-space">
      <div className="site-width timeline-layout">
        <div><p className="eyebrow">從需求到成品</p><h2>合作流程</h2><p>每個合作先釐清需求，再確認提案、報價與授權範圍。</p></div>
        <Timeline steps={steps} />
      </div>
    </section>
    <section className="dark-section section-space">
      <div className="site-width closing-action">
        <div><p className="eyebrow">專案洽詢</p><h2><TitlePhrases phrases={["你想讓誰理解", "這個議題？"]} /></h2></div>
        <div className="closing-contact">
          <Link className="button button-ice" href="/contact#inquiry">合作洽詢</Link>
          <a className="under-link" href={contactUrl}>{site.contact.email}</a>
        </div>
      </div>
    </section>
  </>;
}

import Image from "next/image";
import { NightSky } from "@/components/night-sky";
import { TitlePhrases } from "@/components/title-phrases";
import { site } from "@/config/site";
import { getPodcastFeed } from "@/lib/feeds";
import { pageMeta } from "@/lib/meta";

export const revalidate = 3600;
export const metadata = pageMeta("Podcast", "收聽原創有聲繪本與故事背後的社會議題解析。", "/podcast", "/assets/story-0001.webp");

export default async function PodcastPage() {
  const { episodes, cover: programmeCover } = await getPodcastFeed();
  const schema = { "@context": "https://schema.org", "@type": "PodcastSeries", name: "新創會社｜社會創新", url: site.platforms.apple, inLanguage: "zh-Hant-TW" };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className="page-mast dark-section sky-banner">
      <NightSky variant="podcast" />
      <div className="site-width">
        <p className="eyebrow">新創會社 · 聲音檔案</p><h1 className="phrase-lines"><TitlePhrases phrases={["故事聽完，", "從議題繼續。"]} /></h1>
        <p><TitlePhrases phrases={["有聲繪本帶你走進人物的選擇。", "議題解析從作品的情節出發，", "追問背後的社會問題。"]} /></p>
        <a className="button button-ice podcast-programme" href={site.platforms.apple} target="_blank" rel="noopener noreferrer">在 Apple Podcasts 收聽</a>
      </div>
    </section>
    {!!episodes.length && <section className="site-width section-space">
      <div className="section-heading"><h2>單集列表</h2></div>
      <ol className="episode-stream">{episodes.map((episode) => {
        const cover = episode.kind === "analysis" ? episode.work?.podcastAnalysisCover : episode.work?.podcastCover;
        const label = [episode.number ?? (episode.work ? `CASE ${episode.work.caseNo}` : undefined), episode.kind === "analysis" ? "解析" : "故事"].filter(Boolean).join(" · ");
        const title = episode.title.replace(/^【[^】]+】\s*(?:EP\s*\d+(?:-\d+)?[｜|：:]\s*)?/i, "");
        return <li key={`${episode.url}-${episode.title}`}>
          <span className="episode-thumb"><Image src={cover ?? programmeCover} alt="" fill sizes="88px" /></span>
          <div><span className="mono">{label}</span><h3><TitlePhrases phrases={title.split(/(?<=[：，。！？])|(?<=\p{Script=Han})(?= [A-Za-z])/u).filter(Boolean)} /></h3></div>
          {episode.url !== site.platforms.apple && <a className="button button-ink" href={episode.url} aria-label={`收聽本集：${title}`} target="_blank" rel="noopener noreferrer">收聽本集</a>}
        </li>;
      })}</ol>
    </section>}
  </>;
}

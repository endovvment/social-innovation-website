import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseCard, TopicList } from "@/components/archive";
import { CaseHeroMotion } from "@/components/motion";
import { NightSky } from "@/components/night-sky";
import { TitlePhrases } from "@/components/title-phrases";
import { LiteVideo, ShareButtons } from "@/components/media";
import { VideoGrid } from "@/components/video-grid";
import { site } from "@/config/site";
import { getPodcastFeed, getYouTubeFeed, podcastLinks, relatedVideos, videoCard, workWithVideo } from "@/lib/feeds";
import { pageMeta } from "@/lib/meta";
import { formatDate, getWorks, type Work } from "@/lib/works";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 3600;

export function generateStaticParams() {
  return getWorks().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const work = getWorks().find((item) => item.slug === slug);
  if (!work) return {};
  return pageMeta(work.title, work.tagline, `/works/${slug}`, work.cover);
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const sourceWork = getWorks().find((item) => item.slug === slug);
  if (!sourceWork) notFound();
  const [videos, podcasts] = await Promise.all([getYouTubeFeed(), getPodcastFeed()]);
  const work = workWithVideo(sourceWork, videos.all);
  const isPublished = work.status === "published";
  const media = podcastLinks(work, podcasts);
  const publishedAt = work.publishedAt ?? videos.all.find((video) => video.id === work.youtubeId)?.date;
  const date = formatDate(publishedAt);
  const videoCards = relatedVideos(work, videos.all).map(videoCard);
  const others = getWorks().filter((item) => item.caseNo !== work.caseNo && item.status === "published");
  const themeGroups = [
    ["0001", "0005", "0010"],
    ["0002", "0005", "0006"],
    ["0003", "0008"],
    ["0004", "0007", "0009"],
  ];
  const relatedTheme = (candidate: Work) => themeGroups.filter((group) => group.includes(work.caseNo) && group.includes(candidate.caseNo)).length;
  const related = [...others].sort((a, b) => {
    const common = (topics: string[]) => topics.filter((topic) => work.topics.includes(topic)).length;
    const adjacency = (no: string) => Math.abs(Number(no) - Number(work.caseNo));
    return common(b.topics) - common(a.topics) || relatedTheme(b) - relatedTheme(a) || adjacency(a.caseNo) - adjacency(b.caseNo);
  }).slice(0, 2);
  const schema = {
    "@context": "https://schema.org", "@type": work.isbn ? "Book" : "CreativeWork",
    name: work.title, description: work.tagline, inLanguage: "zh-Hant-TW",
    creator: { "@type": "Organization", name: site.name },
    url: new URL(`/works/${slug}`, site.url).href,
    ...(work.cover ? { image: new URL(work.cover, site.url).href } : {}),
    ...(publishedAt && date ? { datePublished: new Date(publishedAt).toISOString() } : {}),
    ...(work.isbn ? { isbn: work.isbn } : {}),
  };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <section className={`case-hero dark-section ${work.cover ? "" : "case-unreleased"}`}>
      {work.cover && <CaseHeroMotion slug={slug}>
        <Image src={work.cover} alt={`《${work.title}》電影感封面`} fill sizes="100vw" preload />
      </CaseHeroMotion>}
      <NightSky variant={work.cover ? "case" : "casePending"} caseNumber={Number(work.caseNo) || 0} />
      <div className="site-width case-hero-content">
        <Link className="under-link case-back" href="/works#archive-filters">返回案件檔案館</Link>
        <div className="case-heading">
          <span className="mono case-id">CASE {work.caseNo}</span>
          <h1>{work.title}</h1>
          <p><TitlePhrases phrases={work.tagline.split(/(?<=[，。！？；])/u).filter(Boolean)} /></p>
        </div>
      </div>
    </section>
    <div className="site-width case-layout section-space">
      <aside className="case-sidebar" aria-label="案件摘要">
        <p className="eyebrow">案件摘要</p>
        <p className="status"><i />{isPublished ? "已結案" : work.videoOnAir ? "影片已上線" : "調查中"}</p>
        <TopicList topics={work.topics} />
        {date && <p className="case-date">發布於 {date}</p>}
        <nav aria-label="作品段落">
          <a href="#story">故事簡介</a>
          {work.youtubeId && <a href="#watch">影音繪本</a>}
          <a href="#issue">社會議題</a>
        </nav>
      </aside>
      <article className="case-body">
        <section id="story" className="reading-block">
          <h2>故事簡介</h2>
          {work.synopsis.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </section>
        {work.youtubeId && <section id="watch" className="content-block">
          <h2>觀看影音繪本</h2><LiteVideo id={work.youtubeId} cover={work.cover} title={work.title} />
        </section>}
        {(isPublished || media.hasEpisodes) && <section id="listen" className="content-block">
          <h2>收聽故事與議題解析</h2>
          {media.story === media.analysis
            ? <a className="button button-ink" href={site.platforms.apple} target="_blank" rel="noopener noreferrer">在 Apple Podcasts 收聽</a>
            : <div className="episode-pair">
            {[
              { title: "有聲繪本", cover: work.podcastCover, href: media.story, button: "收聽故事" },
              { title: "議題解析", cover: work.podcastAnalysisCover, href: media.analysis, button: "收聽解析" },
            ].map((item) => <div className="episode-small" key={item.title}>
              {item.cover && <div className="square-art"><Image src={item.cover} alt={`${work.title} ${item.title}封面`} fill sizes="(min-width: 1000px) 23vw, 45vw" /></div>}
              <h3>{item.title}</h3>
              <a className="button button-ink" href={item.href} target="_blank" rel="noopener noreferrer">{item.button}</a>
            </div>)}
          </div>}
        </section>}
        <section id="issue" className="issue-note">
          <p className="eyebrow">社會議題</p><h2>這個故事想問什麼？</h2><p>{work.issueNote}</p>
        </section>
        <section className="content-block edition">
          <div><h2>電子繪本</h2>
            {!work.ebookUrl && <p>電子繪本籌備中</p>}
            {work.isbn && <p>ISBN {work.isbn}</p>}
          </div>
          {work.ebookUrl && <a className="button button-ink" href={work.ebookUrl} target="_blank" rel="noopener noreferrer">購買電子繪本</a>}
        </section>
        <section className="content-block edition">
          <div><h2>企業與教育授權</h2><p>洽詢活動、教學或公益倡議使用方式。</p></div>
          <Link className="button button-ink" href="/collaborate#license">了解合作</Link>
        </section>
        {videoCards.length > 0 && <section id="related-videos" aria-labelledby="related-videos-title" className="content-block related-videos">
          <h2 id="related-videos-title">相關影片</h2>
          <VideoGrid videos={videoCards} sizes="(min-width: 800px) 33vw, 90vw" />
        </section>}
        <section className="content-block"><h2>分享作品</h2><ShareButtons title={work.title} /></section>
      </article>
    </div>
    <section className="site-width section-space related-works">
      <div className="section-heading"><h2>延伸閱讀</h2></div>
      <div className="related-grid">{related.map((item) => <article key={item.caseNo}>
        <CaseCard work={item} sizes="(min-width: 800px) 45vw, 100vw" />
      </article>)}</div>
    </section>
  </>;
}

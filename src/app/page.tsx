import Image from "next/image";
import Link from "next/link";
import { HomeGallery } from "@/components/archive";
import { HeroAtmosphere, HeroTitle, IntroVideo, Reveal } from "@/components/motion";
import { NightSky } from "@/components/night-sky";
import { TitlePhrases } from "@/components/title-phrases";
import { VideoGrid } from "@/components/video-grid";
import { site, values } from "@/config/site";
import { getYouTubeFeed, videoCard, workWithVideo, youtubeThumbnail } from "@/lib/feeds";
import { pageMeta } from "@/lib/meta";
import { getWorks } from "@/lib/works";

export const revalidate = 3600;
export const metadata = pageMeta("地球案件檔案館", site.description, "/");

export default async function Home() {
  const videos = await getYouTubeFeed();
  const shorts = new Set(videos.all.filter((video) => video.isShort === true).map((video) => video.id));
  const works = getWorks().map((work) => {
    const display = workWithVideo(work, videos.all);
    return display.youtubeId && shorts.has(display.youtubeId)
      ? { ...display, youtubeId: undefined, cover: work.cover }
      : display;
  });
  const latestVideos = videos.latest.filter((video) => video.isShort !== true).slice(0, 6)
    .map((video) => ({
      ...videoCard(video),
      workSlug: video.work?.slug,
      thumbnail: youtubeThumbnail(video.id, "hq720"),
      fallbackThumbnail: youtubeThumbnail(video.id, "mqdefault"),
    }));
  const published = works.filter((work) => work.status === "published").length;
  const online = works.filter((work) => work.videoOnAir).length;
  const investigating = works.length - published - online;
  const lines = site.slogan.split(/(?<=[，。！？；])/u).filter(Boolean);
  return <>
    <section className="home-hero dark-section">
      <HeroAtmosphere>
        <NightSky variant="home" />
        <div className="observer-plane">
          <Image src="/assets/observer-book.webp" alt="" fill sizes="(min-width: 1000px) 64vw, 100vw" preload />
        </div>
        <IntroVideo />
      </HeroAtmosphere>
      <div className="site-width hero-content">
        <div className="hero-editorial">
          <p className="hero-index mono"><span /> 地球案件檔案館</p>
          <HeroTitle lines={lines} label={site.slogan} />
          <p className="hero-dek">{site.subtitle}</p>
          <p className="hero-intent"><TitlePhrases phrases={["原創社會教育繪本、影音與議題解析。", "提供企業客製創作、教育應用與作品授權。"]} /></p>
          <div className="hero-actions">
            <a className="button button-ice" href="#archive">進入案件檔案館</a>
          </div>
        </div>
        <div className="hero-docket mono">
          <span>地球案件 <b>{published} 件已結案</b></span>
          {online > 0 && <span>{online} 件影片已上線</span>}
          {investigating > 0 && <span>{investigating} 件調查中</span>}
        </div>
      </div>
    </section>

    {latestVideos.length > 0 && <section aria-labelledby="latest-videos-title" className="site-width section-space latest-videos">
      <div className="section-heading">
        <h2 id="latest-videos-title">最新影片</h2>
        <a className="under-link" href={site.platforms.youtube} target="_blank" rel="noopener noreferrer">前往 YouTube 頻道</a>
      </div>
      <VideoGrid videos={latestVideos} sizes="(min-width: 800px) 30vw, 90vw" showDate={false} />
    </section>}

    <section id="archive" className="dark-section gallery-section section-space">
      <div className="site-width">
        <div className="section-heading">
          <div><p className="eyebrow">地球案件</p><h2>案件檔案館</h2></div>
          <Link className="button button-outline" href="/works#archive-filters">查看所有作品</Link>
        </div>
        <HomeGallery works={works} />
      </div>
    </section>

    <section className="brand-section section-space">
      <div className="site-width manifesto">
        <Reveal className="manifesto-head"><p className="eyebrow">品牌理念</p><h2 className="phrase-lines"><TitlePhrases phrases={["從一個人的遭遇，", "看見一群人的處境。"]} /></h2></Reveal>
        <div className="manifesto-body">
          <p>從日常生活中的矛盾與困境，探問背後的社會結構、制度設計與價值選擇，並探索改變現況的可能。</p>
          <ul>{values.map(([value]) => <li key={value}>{value}</li>)}</ul>
          <Link className="button button-ink" href="/about#brand-story">認識新創會社</Link>
        </div>
      </div>
    </section>

    <section className="dark-section home-partnership section-space">
      <div className="site-width">
        <div className="section-heading">
          <div><p className="eyebrow">企業與教育合作</p><h2><TitlePhrases phrases={["把企業與教育議題", "寫進故事"]} /></h2>
            <p className="partnership-copy">為金融素養、公益倡議和課堂教學製作客製繪本、影音及教材，也提供既有作品授權。</p></div>
          <Link className="button button-ice" href="/collaborate#services">了解合作方式</Link>
        </div>
      </div>
    </section>
  </>;
}

import { WorkFilter } from "@/components/archive";
import { NightSky } from "@/components/night-sky";
import { getYouTubeFeed, workWithVideo } from "@/lib/feeds";
import { pageMeta } from "@/lib/meta";
import { getWorks } from "@/lib/works";

export const metadata = pageMeta("原創作品", "依議題、案號與關鍵字探索地球案件。", "/works");
export const revalidate = 3600;

export default async function WorksPage() {
  const { all } = await getYouTubeFeed();
  const works = getWorks().map((work) => workWithVideo(work, all));
  const published = works.filter((work) => work.status === "published").length;
  const online = works.filter((work) => work.videoOnAir).length;
  return <>
    <section className="page-mast dark-section sky-banner">
      <NightSky variant="aurora" />
      <div className="site-width">
        <p className="eyebrow">新創會社 · 原創作品</p>
        <h1>地球案件檔案館</h1>
        <p>每一部繪本都從一個人的處境出發。沿著你關心的議題，打開一份地球案件。</p>
        <div className="mast-index mono"><span>{published} 份已結案</span>{online > 0 && <span>{online} 份影片已上線</span>}
          <span>{works.length - published - online} 份調查中</span></div>
      </div>
    </section>
    <section className="site-width section-space">
      <h2 className="sr-only">搜尋地球案件</h2>
      <WorkFilter works={works} />
    </section>
  </>;
}

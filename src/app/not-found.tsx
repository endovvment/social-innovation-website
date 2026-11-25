import Link from "next/link";
import { ObserverMark } from "@/components/site-shell";
import { NightSky } from "@/components/night-sky";

export const metadata = {
  title: "找不到這份地球案件",
  description: "回到新創會社的地球案件檔案館，探索原創作品。",
  robots: { index: false },
};

export default function NotFound() {
  return <section className="lost-page dark-section sky-banner">
    <NightSky variant="lost" />
    <div className="site-width">
      <ObserverMark className="lost-mark" />
      <p className="mono">404</p>
      <h1>小矮星人迷路了。</h1>
      <p>這份檔案可能已移動。從作品庫可以重新找到你想看的故事。</p>
      <Link className="button button-ice" href="/works#archive-filters">回到案件檔案館</Link>
    </div>
  </section>;
}

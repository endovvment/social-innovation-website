import Image from "next/image";
import Link from "next/link";
import { contactUrl, site } from "@/config/site";
import { FooterMark, FooterObserver, RouteDust } from "@/components/motion";
import { VisitCounter } from "@/components/visit-counter";

export function ObserverMark({ className = "" }: { className?: string }) {
  return <span className={`observer-mark ${className}`} aria-hidden="true">
    <span className="observer-glyph">
      <Image src="/assets/observer-mark.png" alt="" width={85} height={89} />
      <i className="blink blink-left" /><i className="blink blink-right" />
    </span>
  </span>;
}

function Brand({ inFooter = false }: { inFooter?: boolean }) {
  const contents = <>
    {inFooter ? <FooterMark><ObserverMark /></FooterMark> : <ObserverMark />}
    <span><strong>{site.name}</strong><small>{site.englishName}</small></span>
  </>;
  return inFooter ? <div className="brand">{contents}</div> : <Link href="/" className="brand" aria-label="新創會社首頁">{contents}</Link>;
}

export function Header() {
  return <header className="site-header">
    <div className="site-width header-inner">
      <Brand />
      <nav className="site-nav" aria-label="主導覽">
        {site.nav.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <Link className="button button-quiet head-contact" href="/contact">合作洽詢</Link>
    </div>
  </header>;
}

export function PlatformLinks() {
  return <div className="platforms">
    <a href={site.platforms.youtube} target="_blank" rel="noopener noreferrer">YouTube</a>
    <a href={site.platforms.apple} target="_blank" rel="noopener noreferrer">Apple Podcasts</a>
    <a href={contactUrl}>Email</a>
    {site.showSocial && site.social.map((item) => <a key={item.name} href={item.url} target="_blank" rel="noopener noreferrer">{item.name}</a>)}
  </div>;
}

export function Footer() {
  return <footer className="site-footer">
    <div className="site-width">
      <div className="footer-main">
        <div><Brand inFooter /><p>原創社會教育與內容創新</p></div>
        <div className="footer-platforms"><strong>影音平台</strong><PlatformLinks /></div>
        <FooterObserver><ObserverMark /></FooterObserver>
      </div>
      <div className="footer-base">
        <span>© {site.name} · 作品及品牌識別保留相關權利</span>
        <div className="footer-meta">
          <VisitCounter />
          <div className="footer-policies"><Link href="/privacy">隱私權政策</Link><Link href="/terms">使用條款</Link></div>
        </div>
      </div>
    </div>
  </footer>;
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <>
    <a href="#main" className="skip-link">跳到主要內容</a>
    <Header />
    <main id="main">{children}</main>
    <Footer />
    <RouteDust />
  </>;
}

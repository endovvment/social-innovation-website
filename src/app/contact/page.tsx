import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { CopyEmail } from "@/components/copy-email";
import { NightSky } from "@/components/night-sky";
import { PlatformLinks } from "@/components/site-shell";
import { contactUrl, site } from "@/config/site";
import { contactSettings } from "@/lib/contact";
import { pageMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";
export const metadata = pageMeta("聯絡我們", "聯絡新創會社，洽談繪本創作、媒體內容、教育使用或原創作品授權。", "/contact");

export default function ContactPage() {
  const { key, to } = contactSettings();
  return <>
    <section className="page-mast dark-section sky-banner">
      <NightSky variant="contact" />
      <div className="site-width"><p className="eyebrow">合作洽詢</p><h1>聯絡新創會社</h1>
        <p>歡迎提出想談的議題、合作形式與對象，從你希望受眾理解的問題開始。</p>
        <div id="inquiry" className="email-panel">
          <span className="email-label">Email</span>
          <address>{site.contact.email}</address>
          <div className="email-actions">
            <a className="button button-ice" href={contactUrl}>寄信給我們</a>
            <CopyEmail email={site.contact.email} />
          </div>
        </div>
      </div>
    </section>
    <section className="site-width contact-layout section-space">
      <div><h2>官方平台</h2><PlatformLinks />
        <Link className="under-link" href="/collaborate#process">了解合作方式與流程</Link>
      </div>
      {key && to && <div><h2>提出合作需求</h2><ContactForm /></div>}
    </section>
  </>;
}

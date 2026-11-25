import type { Metadata } from "next";
import "@fontsource-variable/noto-sans-tc";
import "@fontsource-variable/noto-serif-tc";
import "./globals.css";
import { site } from "@/config/site";
import { Shell } from "@/components/site-shell";
import { ScrollMotion } from "@/components/motion";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}｜地球案件檔案館`, template: `%s｜${site.name}` },
  description: site.description,
  icons: { icon: "/assets/observer-badge.png" },
  openGraph: { siteName: site.name, locale: "zh_TW", images: [{ url: site.ogImage, width: 1200, height: 630, alt: `${site.name}｜${site.slogan}` }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const organisation = {
    "@context": "https://schema.org", "@type": "Organization", name: site.name,
    alternateName: site.englishName, url: site.url, logo: new URL("/assets/observer-badge.png", site.url).href,
    founder: { "@type": "Person", name: site.founder },
    sameAs: [site.platforms.youtube, site.platforms.apple, ...(site.showSocial ? site.social.map(({ url }) => url) : [])],
  };
  return <html lang="zh-Hant-TW">
    <body>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, "\\u003c") }} />
      <Shell>{children}</Shell>
      <ScrollMotion />
    </body>
  </html>;
}

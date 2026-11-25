import type { Metadata } from "next";
import { site } from "@/config/site";

export function pageMeta(title: string, description: string, path: string, image: string = site.ogImage): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title}｜${site.name}`, description, url: path,
      type: "website", locale: "zh_TW", siteName: site.name,
      images: [image === site.ogImage
        ? { url: image, width: 1200, height: 630, alt: `${site.name}｜${site.slogan}` }
        : { url: image, alt: title }],
    },
  };
}

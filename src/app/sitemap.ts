import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { getWorks } from "@/lib/works";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["/", "/works", "/podcast", "/collaborate", "/about", "/shop", "/contact", "/privacy", "/terms"];
  const workRoutes = getWorks().map((work) => `/works/${work.slug}`);
  return [...routes, ...workRoutes].map((path) => ({ url: new URL(path, site.url).href }));
}

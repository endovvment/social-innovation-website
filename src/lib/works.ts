import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export type Work = {
  caseNo: string;
  title: string;
  slug: string;
  status: "published" | "in-production";
  topics: string[];
  tagline: string;
  synopsis: string;
  issueNote: string;
  cover?: string;
  podcastCover?: string;
  podcastAnalysisCover?: string;
  youtubeId?: string;
  youtubeExtra?: { id: string; title: string }[];
  podcastStoryUrl?: string;
  podcastAnalysisUrl?: string;
  ebookUrl?: string;
  isbn?: string;
  publishedAt?: string | Date;
  featured?: boolean;
};

export type DisplayWork = Work & { videoOnAir?: boolean };

export const getWorks = cache((): Work[] => {
  const directory = path.join(process.cwd(), "src", "content", "works");
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .map((file) => matter(fs.readFileSync(path.join(directory, file), "utf8")).data as Work)
    .sort((a, b) => a.caseNo.localeCompare(b.caseNo));
});

export function formatDate(value: string | Date | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.valueOf())
    ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "medium", timeZone: "Asia/Taipei" }).format(date)
    : "";
}

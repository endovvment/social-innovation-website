import { cache } from "react";
import { XMLParser, XMLValidator } from "fast-xml-parser";
import { site } from "@/config/site";
import { createFeedSnapshot } from "@/lib/feed-snapshot";
import { formatDate, getWorks, type DisplayWork, type Work } from "@/lib/works";

type XmlValue = string | Record<string, unknown> | undefined;
type FeedItem = Record<string, XmlValue>;
type Video = { id: string; title: string; date?: string; isShort?: boolean };
export type YouTubeItem = Video & { work?: Work };
type VideoCatalogue = { latest: Video[]; history: Video[] };
type AppleItem = {
  kind?: string; trackName?: string; trackViewUrl?: string; releaseDate?: string;
  artworkUrl600?: string; artworkUrl100?: string; artworkUrl60?: string;
};
type EpisodeRecord = {
  title: string; url: string; date?: string; kind: "story" | "analysis"; number?: string;
};
type PodcastCatalogue = { cover?: string; episodes: EpisodeRecord[] };

export const YOUTUBE_FEED_TAG = "youtube-channel-v1";
export const PODCAST_FEED_TAG = "apple-podcasts-v1";
const videoIdPattern = /^[\w-]{11}$/;
const appleCoverHost = /^is\d+(?:-ssl)?\.mzstatic\.com$/;
const parser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: false,
  processEntities: false,
  isArray: (name) => name === "entry",
});

async function requestFeed(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (!response.ok || Number(response.headers.get("content-length")) > 2_000_000) throw new Error("Media feed unavailable");
  const body = await response.text();
  if (body.length > 2_000_000) throw new Error("Media feed is too large");
  return body;
}

function text(value: XmlValue) {
  const content = typeof value === "string" ? value : value?.["#text"];
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return typeof content === "string"
    ? content.trim().replace(/&(amp|lt|gt|quot|apos);/g, (_, key: string) => entities[key])
    : "";
}

async function isYouTubeShort(id: string): Promise<boolean | undefined> {
  try {
    const response = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: "HEAD", redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(3500),
    });
    if (response.status === 200) return true;
    if (response.status >= 300 && response.status < 400) return false;
  } catch { /* an unknown result can still be shown as a regular video */ }
}

async function fetchYouTube(previous?: VideoCatalogue): Promise<VideoCatalogue> {
  const xml = await requestFeed(site.feeds.youtube);
  if (XMLValidator.validate(xml) !== true) throw new Error("Invalid YouTube feed");
  const data = parser.parse(xml) as { feed?: { entry?: FeedItem[] } };
  const entries = new Map<string, Video>();
  for (const entry of data.feed?.entry ?? []) {
    const id = text(entry["yt:videoId"]);
    const title = text(entry.title);
    const date = text(entry.published);
    if (videoIdPattern.test(id) && title && Number.isFinite(Date.parse(date))) entries.set(id, { id, title, date });
  }
  if (!entries.size) throw new Error("No usable videos in the YouTube feed");
  const known = new Map([...(previous?.latest ?? []), ...(previous?.history ?? [])].map((video) => [video.id, video]));
  const latest = await Promise.all([...entries.values()].map(async (video) => ({
    ...video,
    isShort: known.get(video.id)?.isShort ?? await isYouTubeShort(video.id),
  })));
  latest.sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!));
  return { latest, history: [...known.values()].filter((video) => !entries.has(video.id)) };
}

function appleEpisodeUrl(value?: string) {
  if (!value) return;
  try {
    const url = new URL(value);
    const episode = url.searchParams.get("i");
    if (url.protocol === "https:" && url.hostname === "podcasts.apple.com" &&
      url.pathname.endsWith("/id6836434776") && episode && /^\d+$/.test(episode)) return `${site.platforms.apple}?i=${episode}`;
  } catch { /* an invalid episode URL falls back to the programme */ }
}

function appleCover(item?: AppleItem) {
  const artwork = item?.artworkUrl600 || item?.artworkUrl100 || item?.artworkUrl60;
  if (!artwork) return;
  try {
    const url = new URL(artwork);
    if (url.protocol === "https:" && appleCoverHost.test(url.hostname) && url.pathname.startsWith("/image/thumb/") &&
      !url.search && !url.username && !url.password && !url.port) return url.href;
  } catch { /* use the local podcast image */ }
}

async function fetchPodcasts(previous?: PodcastCatalogue): Promise<PodcastCatalogue> {
  const data = JSON.parse(await requestFeed(site.feeds.podcast)) as { results?: AppleItem[] };
  if (!Array.isArray(data.results)) throw new Error("Invalid Apple Podcasts feed");
  const episodes = new Map<string, EpisodeRecord>();
  for (const item of data.results) {
    if (item?.kind !== "podcast-episode" || typeof item.trackName !== "string") continue;
    const title = item.trackName.trim();
    const url = appleEpisodeUrl(item.trackViewUrl);
    if (!title || !url) continue;
    episodes.set(url, {
      title, url, date: item.releaseDate,
      kind: !title.startsWith("【故事】") && /解析|深度解讀/.test(title) ? "analysis" : "story",
      number: title.match(/\bEP\s*\d+(?:-\d+)?/i)?.[0].replace(/\s/g, "").toUpperCase(),
    });
  }
  if (!episodes.size) throw new Error("No usable episodes in the Apple Podcasts feed");
  return {
    cover: appleCover(data.results.find((item) => item?.kind === "podcast")) ?? previous?.cover,
    episodes: [...episodes.values()].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  };
}

const youtube = createFeedSnapshot(YOUTUBE_FEED_TAG, site.feeds.youtube, fetchYouTube);
const podcasts = createFeedSnapshot(PODCAST_FEED_TAG, site.feeds.podcast, fetchPodcasts);

export function refreshMediaFeeds() {
  return Promise.allSettled([youtube.refresh(), podcasts.refresh()]);
}

const normalise = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[\p{P}\s]/gu, "");

const getWorkTitles = cache(() => getWorks().map((work) => ({ work, title: normalise(work.title) }))
  .filter(({ title }) => title).sort((a, b) => b.title.length - a.title.length));

function findWork(title: string) {
  const value = normalise(title);
  return getWorkTitles().find((item) => value.includes(item.title))?.work;
}

export const getYouTubeFeed = cache(async () => {
  const data = await youtube.get();
  const existingIds = new Map<string, Work>();
  for (const work of getWorks()) {
    if (work.youtubeId) existingIds.set(work.youtubeId, work);
    for (const extra of work.youtubeExtra ?? []) if (!existingIds.has(extra.id)) existingIds.set(extra.id, work);
  }
  const match = (video: Video): YouTubeItem => ({ ...video, work: existingIds.get(video.id) ?? findWork(video.title) });
  const latest = (data?.latest ?? []).map(match);
  const all = [...latest, ...(data?.history ?? []).map(match)];
  all.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return { latest, all };
});

export const getPodcastFeed = cache(async () => {
  const data = await podcasts.get();
  const entries = data?.episodes ?? getWorks().flatMap((work): EpisodeRecord[] => [
    ...(appleEpisodeUrl(work.podcastStoryUrl) ? [{ title: work.title, kind: "story", url: appleEpisodeUrl(work.podcastStoryUrl)! } as const] : []),
    ...(appleEpisodeUrl(work.podcastAnalysisUrl) ? [{ title: `${work.title}：議題解析`, kind: "analysis", url: appleEpisodeUrl(work.podcastAnalysisUrl)! } as const] : []),
  ]);
  return {
    cover: data?.cover ?? "/assets/observer-badge.png",
    episodes: entries.map((episode) => ({
      ...episode,
      work: getWorks().find((work) => [work.podcastStoryUrl, work.podcastAnalysisUrl]
        .some((link) => appleEpisodeUrl(link) === episode.url)) ?? findWork(episode.title),
    })),
  };
});

export function podcastLinks(work: Work, { episodes }: Awaited<ReturnType<typeof getPodcastFeed>>) {
  const matches = episodes.filter((episode) => episode.work?.caseNo === work.caseNo);
  const storyEpisode = matches.find((episode) => episode.kind === "story");
  const analysisEpisode = matches.find((episode) => episode.kind === "analysis");
  return {
    story: storyEpisode?.url ?? site.platforms.apple,
    analysis: analysisEpisode?.url ?? site.platforms.apple,
    hasEpisodes: !!(storyEpisode || analysisEpisode),
  };
}

export function youtubeThumbnail(id: string, size: "hqdefault" | "hq720" | "mqdefault" = "hqdefault") {
  return `https://i.ytimg.com/vi/${id}/${size}.jpg`;
}

export function videoCard({ id, title, date }: Video) {
  return { id, title, date, displayDate: formatDate(date), thumbnail: youtubeThumbnail(id) };
}

export function workWithVideo(work: Work, videos: YouTubeItem[]): DisplayWork {
  if (work.status !== "in-production") return work;
  const uploads = videos.filter((video) => video.work?.caseNo === work.caseNo);
  const youtubeId = work.youtubeId ?? (uploads.find((video) => video.isShort !== true) ?? uploads[0])?.id;
  if (!youtubeId) return work;
  return { ...work, youtubeId, cover: work.cover ?? youtubeThumbnail(youtubeId), videoOnAir: true };
}

export function relatedVideos(work: Work, videos: YouTubeItem[]): Video[] {
  const matches = new Map(videos.filter((video) => video.work?.caseNo === work.caseNo &&
    video.id !== work.youtubeId).map((video) => [video.id, video]));
  for (const extra of work.youtubeExtra ?? []) {
    if (extra.id !== work.youtubeId && videoIdPattern.test(extra.id) && !matches.has(extra.id)) matches.set(extra.id, extra);
  }
  if (!work.youtubeId && matches.size < 2) return [];
  return [...matches.values()].slice(0, 4);
}

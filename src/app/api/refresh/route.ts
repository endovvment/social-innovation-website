import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { PODCAST_FEED_TAG, refreshMediaFeeds, YOUTUBE_FEED_TAG } from "@/lib/feeds";

const digest = (value: string) => createHash("sha256").update(value).digest();
const text = (body: string, status: number) => new Response(body, {
  status,
  headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
});

export async function GET(request: Request) {
  const expected = process.env.REFRESH_KEY;
  const key = new URL(request.url).searchParams.get("key") ?? "";
  if (!expected || !timingSafeEqual(digest(key), digest(expected))) return text("未授權", 401);

  const [youtube, podcasts] = await refreshMediaFeeds();
  if (youtube.status === "fulfilled") {
    revalidateTag(YOUTUBE_FEED_TAG, { expire: 0 });
    revalidatePath("/works");
  }
  if (podcasts.status === "fulfilled") {
    revalidateTag(PODCAST_FEED_TAG, { expire: 0 });
    revalidatePath("/podcast");
  }
  if (youtube.status === "fulfilled" || podcasts.status === "fulfilled") {
    revalidatePath("/");
    revalidatePath("/works/[slug]", "page");
  }
  if (youtube.status === "rejected" || podcasts.status === "rejected") {
    return text("有來源暫時無法更新，已保留該來源上一次的資料", 503);
  }
  return text("網站資料已更新", 200);
}

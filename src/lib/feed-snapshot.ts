import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { access, mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout as wait } from "node:timers/promises";
import { unstable_cache } from "next/cache";

export const FEED_INTERVAL = 3600;
type Snapshot<T> = { updatedAt: number; data: T };

async function snapshotDirectory() {
  const configured = process.env.FEED_CACHE_DIR;
  const directory = configured ? resolve(configured) : join(process.cwd(), ".next", "cache", "site-feeds");
  try {
    await mkdir(directory, { recursive: true });
    await access(directory, constants.W_OK);
    return directory;
  } catch (error) {
    if (configured) throw error;
    const instance = createHash("sha256").update(process.cwd()).digest("hex").slice(0, 16);
    const fallback = join(tmpdir(), "earth-archive-feeds", instance);
    await mkdir(fallback, { recursive: true });
    return fallback;
  }
}

export function createFeedSnapshot<T>(tag: string, url: string, fetchSource: (previous?: T) => Promise<T>) {
  let directory: Promise<string> | undefined;
  let pending: Promise<T> | undefined;
  let memory: Snapshot<T> | undefined;
  const name = createHash("sha256").update(`${tag}:${url}`).digest("hex").slice(0, 24);
  const filePath = async () => join(await (directory ??= snapshotDirectory()), `${name}.json`);

  async function read() {
    try {
      const saved = JSON.parse(await readFile(await filePath(), "utf8")) as Snapshot<T>;
      if (Number.isFinite(saved.updatedAt) && saved.data !== undefined && saved.updatedAt >= (memory?.updatedAt ?? 0)) memory = saved;
    } catch { /* the last in-memory snapshot remains available */ }
    return memory;
  }

  async function update(): Promise<T> {
    const requestedAt = Date.now();
    const file = await filePath();
    const lock = `${file}.lock`;
    const deadline = requestedAt + 15_000;
    // Next can render different routes in different workers during a cold build.
    while (Date.now() < deadline) {
      const current = await read();
      if (current && current.updatedAt >= requestedAt) return current.data;
      const handle = await open(lock, "wx").catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "EEXIST") throw error;
      });
      if (!handle) {
        const age = await stat(lock).then((info) => Date.now() - info.mtimeMs, () => 0);
        if (age > 30_000) await unlink(lock).catch(() => {});
        await wait(120);
        continue;
      }
      const temporary = `${file}.${randomUUID()}.tmp`;
      try {
        const previous = await read();
        if (previous && previous.updatedAt >= requestedAt) return previous.data;
        const data = await fetchSource(previous?.data);
        const snapshot = { updatedAt: Date.now(), data };
        await writeFile(temporary, JSON.stringify(snapshot), { encoding: "utf8", mode: 0o600 });
        await rename(temporary, file);
        memory = snapshot;
        return data;
      } finally {
        await handle.close().catch(() => {});
        await Promise.all([unlink(temporary).catch(() => {}), unlink(lock).catch(() => {})]);
      }
    }
    throw new Error(`Timed out updating the ${tag} feed`);
  }

  const refresh = () => pending ??= update().finally(() => { pending = undefined; });
  const cached = unstable_cache(async () => {
    const previous = await read();
    if (previous && Date.now() - previous.updatedAt < FEED_INTERVAL * 1000) return previous.data;
    return refresh();
  }, [tag, url], { tags: [tag], revalidate: FEED_INTERVAL });

  return {
    async get() {
      try { return await cached(); }
      catch { return (await read())?.data; }
    },
    refresh,
  };
}

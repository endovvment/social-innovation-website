import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { chromium } from "playwright";
import matter from "gray-matter";

const base = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const enabled = process.env.SCREENSHOT_GROUP || "all";
const output = join(process.cwd(), "screenshots");
const bannerDir = join(output, "banners");
const motionDir = join(output, "motion");
const bannerSelector = "main > :is(.home-hero, .sky-banner, .case-hero)";
const installedWindowsBrowser = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER || (existsSync(chromium.executablePath()) ? chromium.executablePath() : installedWindowsBrowser),
  headless: true,
  chromiumSandbox: true,
});

const workDir = join(process.cwd(), "src/content/works");
const works = readdirSync(workDir).filter((file) => file.endsWith(".md")).sort()
  .map((file) => matter(readFileSync(join(workDir, file), "utf8")).data);
const listing = [
  { group: "home", path: "/", file: "home" },
  { group: "works", path: "/works", file: "works" },
  ...works.map((work) => ({ group: "works", path: `/works/${work.slug}`, file: `case-${work.caseNo}-${work.slug}` })),
  ...["podcast", "collaborate", "about", "shop", "contact", "privacy", "terms"].map((page) => ({ group: "pages", path: `/${page}`, file: page })),
  { group: "pages", path: "/lost-observer", file: "404", status: 404 },
];
const publicPlatforms = {
  YouTube: "https://www.youtube.com/@新創會社",
  "Apple Podcasts": "https://podcasts.apple.com/tw/podcast/id6836434776",
  Email: "mailto:endovvment@gmail.com?subject=%E3%80%90%E5%90%88%E4%BD%9C%E6%B4%BD%E8%A9%A2%E3%80%91",
  Facebook: "https://www.facebook.com/profile.php?id=61589444075279",
  Instagram: "https://www.instagram.com/endovvment/",
  Threads: "https://www.threads.com/@endovvment",
};
const selectedEntries = listing.filter(({ path }) => !process.env.SCREENSHOT_PATH || path === process.env.SCREENSHOT_PATH);

async function verifyPlatforms(container) {
  for (const [name, href] of Object.entries(publicPlatforms)) {
    const link = container.getByRole("link", { name, exact: true });
    assert.equal(await link.isVisible(), true, `${name} is visible`);
    assert.equal(await link.getAttribute("href"), href);
    if (name !== "Email") assert.equal(await link.getAttribute("target"), "_blank");
  }
}

async function settleImages(page) {
  await page.waitForLoadState("networkidle", { timeout: 30000 });
  await page.evaluate(async () => {
    const images = [...document.images];
    for (const image of images) image.loading = "eager";
    await Promise.all([document.fonts.ready, ...images.map(async (image) => {
      try { await image.decode(); } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await image.decode().catch(() => undefined);
      }
    })]);
  });
}

async function checkNavigation(page) {
  await page.goto(base + "/works", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  const input = page.getByRole("searchbox");
  await input.fill("滴答銀行");
  await page.getByRole("status").filter({ hasText: "1 部作品" }).waitFor();
  await input.fill("這筆測試找不到");
  await page.getByText("找不到符合條件的作品").waitFor();
  await page.getByRole("button", { name: "清除篩選" }).click();
  await page.getByRole("status").filter({ hasText: "10 部作品" }).waitFor();
  await page.getByLabel("案號排序").selectOption("desc");
  await page.locator(".archive-item").first().getByRole("heading", { name: "被偷走的聲音" }).waitFor();
  await page.getByRole("link", { name: "打開案件 0001：賭徒潘恩" }).click();
  await page.waitForURL("**/works/gambler-paine");
  assert.ok(!(await page.locator("iframe").count()), "YouTube iframe must wait for a click");
  await page.getByRole("button", { name: "播放《賭徒潘恩》" }).click();
  assert.match(await page.locator("iframe").getAttribute("src"), /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
  const embedded = await page.locator("iframe").contentFrame().locator("body").innerText({ timeout: 15000 }).catch(() => "");
  if (embedded && /unavailable|無法播放|sign in to confirm/i.test(embedded)) {
    console.log("YouTube loaded the player, but platform playback is restricted in this browser context.");
  } else {
    const player = page.frames().find((frame) => frame.url().startsWith("https://www.youtube-nocookie.com/embed/"));
    const advancing = await player?.waitForFunction(() => document.querySelector("video")?.currentTime > 0, null, { timeout: 10000 }).catch(() => false);
    console.log(advancing ? "YouTube playback advanced after activation." : "YouTube click-to-load verified. Playback progress was not confirmed.");
  }
  await page.goto(base + "/podcast", { waitUntil: "domcontentloaded" });
  const episodeLinks = page.locator(".episode-stream a[href]");
  const links = await episodeLinks.evaluateAll((anchors) => anchors.map((anchor) => anchor.href));
  if (links.length > 0) {
    assert.ok(links.every((link) => /^https:\/\/podcasts\.apple\.com\/tw\/podcast\/id6836434776\?i=\d+$/.test(link)));
    assert.equal(links.length, new Set(links).size, "Episode links are unique");
    console.log(`Apple Podcasts: ${links.length} direct episode links.`);
  } else {
    await page.getByRole("link", { name: "在 Apple Podcasts 收聽", exact: true }).waitFor();
    console.log("Apple Podcasts: the programme link is available during the catalogue fallback.");
  }
  await page.goto(base + "/shop", { waitUntil: "domcontentloaded" });
  assert.equal(await page.getByRole("link", { name: "購買電子繪本" }).count(), works.filter((work) => work.ebookUrl).length);
  await page.goto(base + "/contact", { waitUntil: "domcontentloaded" });
  await verifyPlatforms(page.locator(".contact-layout .platforms"));
  assert.equal(await page.getByRole("link", { name: "寄信給我們" }).getAttribute("href"), publicPlatforms.Email);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await page.getByRole("button", { name: "複製信箱" }).click();
  await page.getByRole("status").filter({ hasText: "已複製" }).waitFor();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), "endovvment@gmail.com");
  const organisation = JSON.parse(await page.locator("body > script[type='application/ld+json']").first().textContent());
  assert.deepEqual(organisation.sameAs, [publicPlatforms.YouTube, publicPlatforms["Apple Podcasts"], publicPlatforms.Facebook, publicPlatforms.Instagram, publicPlatforms.Threads]);
  if (!process.env.RESEND_API_KEY) {
    assert.equal(await page.getByRole("button", { name: "送出合作洽詢" }).count(), 0);
    const response = await page.request.post(base + "/api/contact", { data: {} });
    assert.equal(response.status(), 503);
  }
  for (const path of ["/sitemap.xml", "/robots.txt"]) {
    const response = await page.request.get(base + path);
    assert.ok(response.ok(), path);
  }
}

async function checkMotion(page) {
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.locator(".pin-spacer").first().waitFor({ state: "attached" });
  const videoIs = (muted) => page.waitForFunction((expected) => {
    const video = document.querySelector(".hero-video");
    return !video.paused && video.muted === expected;
  }, muted);
  await page.getByRole("button", { name: "暫停開場動畫" }).waitFor({ timeout: 18000 });
  await page.locator(".hero-index").click({ force: true });
  await videoIs(false);
  await page.waitForFunction(() => {
    const video = document.querySelector(".hero-video");
    return !video.muted && video.volume > 0 && video.volume < 0.24;
  });
  await videoIs(true);
  await page.getByRole("button", { name: "開啟聲音" }).click();
  await videoIs(false);
  await page.waitForFunction(() => {
    const video = document.querySelector(".hero-video");
    return video.loop && video.currentTime > video.duration - 0.45;
  });
  await page.waitForFunction(() => {
    const video = document.querySelector(".hero-video");
    return video.currentTime < 1 && !video.muted && Math.abs(video.volume - 0.3) < .001;
  });
  await page.getByRole("button", { name: "關閉聲音" }).click();
  await videoIs(true);
  await page.getByRole("button", { name: "暫停開場動畫" }).click();
  await page.getByRole("button", { name: "播放開場動畫" }).waitFor();
  const options = page.getByLabel("依議題選看");
  const count = await page.locator(".gallery-card").count();
  await options.selectOption({ index: 1 });
  await page.waitForFunction((previousCount) => {
    const visibleCount = document.querySelectorAll(".gallery-card").length;
    return visibleCount > 0 && visibleCount < previousCount;
  }, count);
}

async function checkSky(page) {
  await page.addInitScript(() => {
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const stroke = CanvasRenderingContext2D.prototype.stroke;
    window.skyDraws = 0;
    window.meteorStrokes = 0;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.dataset.sky) window.skyDraws++;
      return clear.call(this, ...args);
    };
    CanvasRenderingContext2D.prototype.stroke = function (...args) {
      if (this.canvas.dataset.sky === "podcast") window.meteorStrokes++;
      return stroke.call(this, ...args);
    };
  });
  await page.goto(base + "/works", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.skyDraws > 3);
  await page.waitForLoadState("networkidle");
  const fps = await page.evaluate(async () => {
    const before = window.skyDraws;
    const start = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return Math.round((window.skyDraws - before) * 1000 / (performance.now() - start));
  });
  console.log(`Canvas sample: ${fps} draws/second on the visible desktop aurora.`);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => document.querySelector(".night-sky").getBoundingClientRect().bottom < 0);
  const offscreen = await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const before = window.skyDraws;
    await new Promise((resolve) => setTimeout(resolve, 180));
    return window.skyDraws - before;
  });
  assert.equal(offscreen, 0, "Canvas stops drawing outside the viewport");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector(".night-sky").getBoundingClientRect().bottom > 0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const hidden = await page.evaluate(async () => {
    const before = window.skyDraws;
    await new Promise((resolve) => setTimeout(resolve, 180));
    return window.skyDraws - before;
  });
  assert.equal(hidden, 0, "Canvas stops drawing when the document is hidden");
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const quietDraws = await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const before = window.skyDraws;
    await new Promise((resolve) => setTimeout(resolve, 180));
    return window.skyDraws - before;
  });
  assert.ok(quietDraws > 0, "Reduced motion retains gentle sky animation");
  await page.goto(base + "/podcast", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => window.skyDraws > 10);
  assert.equal(await page.evaluate(() => window.meteorStrokes), 0, "Reduced motion disables meteors");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(() => window.meteorStrokes > 0, null, { timeout: 4000 });
  await page.goto(base + "/works", { waitUntil: "domcontentloaded" });
  const cover = page.locator(".archive-item .aperture-media").first();
  await cover.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".archive-item .case-reveal").classList.contains("is-focused"));
  assert.equal(await cover.evaluate((element) => getComputedStyle(element).animationName), "lens-focus");
  assert.equal(await cover.evaluate((element) => getComputedStyle(element).animationDuration), "0.9s");
}

async function captureMotion(entries) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const variants = entries.map((entry) => [entry, false]);
  const snow = entries.find((entry) => entry.path === "/about");
  if (snow) variants.push([snow, true]);
  for (const [entry, reduced] of variants) {
    await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
    await page.goto(base + entry.path, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => document.fonts.ready);
    const banner = page.locator(bannerSelector);
    await page.waitForFunction(() => document.querySelector("main canvas[data-sky]")?.width >= 1440);
    if (entry.path === "/") {
      await page.getByRole("button", { name: "暫停開場動畫" }).click();
      await page.mouse.move(10, 16);
    }
    const samples = [];
    const started = performance.now();
    for (const [index, elapsed] of [0, 1050, 2280].entries()) {
      const wait = elapsed - (performance.now() - started);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      const filename = `${entry.file}${reduced ? "-reduced" : ""}-${index + 1}.jpg`;
      await banner.screenshot({ path: join(motionDir, filename), quality: 93 });
      samples.push(await banner.locator("canvas").evaluateAll((canvases) => canvases.map(
        (canvas) => canvas.toDataURL()).join("")));
    }
    assert.equal(new Set(samples).size, 3, `${entry.file}: all three sky frames visibly change`);
    console.log(`Motion · ${entry.file}${reduced ? " (reduced motion)" : ""} · 3 distinct Canvas frames`);
  }
  await page.close();
}

async function captureShare() {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: `
    header, footer, #main > :not(.home-hero), .hero-atmosphere > :not(.night-sky), .hero-content, .route-dust { display: none !important; }
    .home-hero { width: 1200px; height: 630px; min-height: 0; }
    .hero-atmosphere::after { background: linear-gradient(90deg, #0b12204d, transparent 70%); }
    .share-caption { position: absolute; top: 202px; left: 94px; color: #f3f7ff; }
    .share-caption h1 { font: 700 102px/1.1 var(--serif); }
    .share-caption p { margin-top: 28px; color: #c3dafa; font: 550 38px/1.6 var(--serif); }
    .share-caption p span { display: block; }
  ` });
  await page.evaluate(() => {
    const heading = document.createElement("h1");
    heading.textContent = document.querySelector(".site-header .brand strong").textContent;
    const slogan = document.createElement("p");
    const lines = document.querySelector(".hero-title").getAttribute("aria-label").split(/(?<=[，。！？；])/u);
    for (const line of lines.filter(Boolean)) {
      const span = document.createElement("span");
      span.textContent = line;
      slogan.append(span);
    }
    const caption = document.createElement("div");
    caption.className = "share-caption";
    caption.append(heading, slogan);
    document.querySelector(".home-hero").append(caption);
  });
  await page.waitForFunction(() => document.querySelector('[data-sky="home"]').height === 630);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(process.cwd(), "public/assets/night-sky-share.jpg"), quality: 94 });
  await page.close();
  console.log("1200 × 630 · Open Graph · public/assets/night-sky-share.jpg");
}

async function checkScreenshotPage(page, entry, viewportWidth) {
  const response = await page.goto(base + entry.path, { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), entry.status ?? 200, entry.path);
  await page.locator("main h1").waitFor();
  await settleImages(page);
  await verifyPlatforms(page.locator(".site-footer .platforms"));
  const metrics = await page.evaluate(() => {
    const anchors = [...document.querySelectorAll("header a[href], main a[href], footer a[href]")];
    const visibleTargets = anchors.filter((anchor) =>
      !anchor.closest(".site-header .brand, footer, .video-grid") && anchor.protocol !== "mailto:" && anchor.getClientRects().length
    ).map((anchor) => anchor.href);
    const headingFont = (tag) => [...document.querySelectorAll(`main ${tag}`)].filter((heading) => heading.getClientRects().length && !heading.classList.contains("sr-only"))
      .map((heading) => [parseFloat(getComputedStyle(heading).fontSize), getComputedStyle(heading).fontWeight]);
    return {
      width: document.documentElement.scrollWidth,
      bodySize: parseFloat(getComputedStyle(document.body).fontSize),
      headings: ["h1", "h2", "h3"].map(headingFont),
      banner: (() => {
        const title = document.querySelector("main h1");
        const lead = document.querySelector(".hero-dek, .sky-banner h1 + p:not(.legal-date), .case-heading h1 + p");
        const description = document.querySelector(".hero-intent, .sky-banner h1 + p:not(.legal-date), .case-heading h1 + p");
        const kicker = document.querySelector(".hero-index, .sky-banner .eyebrow");
        const size = (el) => el && parseFloat(getComputedStyle(el).fontSize);
        return { ratio: lead ? size(title) / size(lead) : null, description: size(description), kicker: size(kicker) };
      })(),
      extraTitleLines: [...document.querySelectorAll(".phrase-lines")].filter((heading) =>
        heading.offsetHeight > parseFloat(getComputedStyle(heading).lineHeight) * 2.1).map((heading) => heading.textContent),
      broken: [...document.images].filter((image) => !image.complete || !image.naturalWidth).map((image) => image.getAttribute("src")),
      obsolete: /soundon/i.test(document.body.innerText) || anchors.some((anchor) => /soundon\.fm/i.test(anchor.href)),
      duplicateLinks: visibleTargets.filter((href, index) => visibleTargets.indexOf(href) !== index),
      undersized: [...document.querySelectorAll("header *, main *, footer *")]
        .filter((element) => element.getClientRects().length && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()))
        .filter((element) => {
          const shortLabel = element.closest("main .eyebrow, main .mono, main .topic-list, main .status, main .case-date, main .case-type, main .edition-status, main .legal-date");
          return parseFloat(getComputedStyle(element).fontSize) < (shortLabel ? 15 : 16);
        }).map((element) => [element.textContent.slice(0, 32), getComputedStyle(element).fontSize]),
    };
  });
  assert.ok(metrics.width <= viewportWidth + 1, `${entry.path}: horizontal overflow of ${metrics.width}px at ${viewportWidth}px`);
  assert.deepEqual(metrics.broken, [], `${entry.path}: broken images`);
  assert.equal(metrics.obsolete, false, `${entry.path}: old podcast provider is visible`);
  assert.deepEqual(metrics.duplicateLinks, [], `${entry.path}: duplicate links`);
  assert.deepEqual(metrics.undersized, [], `${entry.path}: undersized text at ${viewportWidth}px`);
  assert.deepEqual(metrics.extraTitleLines, [], `${entry.path}: unexpected title wrap at ${viewportWidth}px`);
  assert.equal(metrics.bodySize, viewportWidth === 390 ? 16 : 18, `${entry.path}: body text`);
  const mobile = viewportWidth === 390;
  const home = entry.path === "/";
  const minimums = mobile ? [home ? 34 : 30, 26, 20] : [home ? 52 : 40, 32, 22];
  const maximums = mobile ? [home ? 38 : 32, 28, 20] : [home ? 56 : 44, 36, 24];
  for (const [index, headings] of metrics.headings.entries()) {
    for (const [size, weight] of headings) {
      assert.ok(size >= minimums[index] && size <= maximums[index] && weight === "700",
        `${entry.path}: H${index + 1} at ${size}px / ${weight}`);
    }
  }
  if (metrics.banner.ratio !== null) assert.ok(metrics.banner.ratio <= 2.201, `${entry.path}: banner title-to-lead ratio`);
  if (metrics.banner.kicker !== null) assert.equal(metrics.banner.kicker, mobile ? 16 : 17, `${entry.path}: banner kicker`);
  if (metrics.banner.description !== null) {
    assert.ok(metrics.banner.description >= (mobile ? 17 : 20) && metrics.banner.description <= (mobile ? 18 : 21),
      `${entry.path}: banner description size`);
  }
  if (entry.path === "/") {
    assert.equal(await page.locator(".hero-video").getAttribute("src"), null, "Reduced motion leaves the video unloaded");
    assert.equal(await page.locator(".gallery-card").count(), works.length - 1);
    if (works.some((work) => work.caseNo === "0010" && work.status === "in-production")) {
      assert.equal(await page.locator(".gallery-card").filter({ hasText: "CASE 0010" }).getByRole("link").count(), 1);
    }
  }
  const filename = `${entry.file}${mobile ? "-mobile" : ""}.jpg`;
  // Keep the covers in their resting state when capture scrolls beyond the viewport.
  await page.addStyleTag({ content: ".case-reveal .aperture-media { animation: none !important; opacity: 1 !important; clip-path: none !important; }" });
  const selectedSection = entry.path === "/" ? ".latest-videos" : entry.path === "/works/gambler-paine" ? "#related-videos" : "";
  if (selectedSection) {
    const section = page.locator(selectedSection);
    if (await section.count()) {
      const videoIds = await section.locator("[data-video-id]").evaluateAll((cards) => cards.map((card) => card.dataset.videoId));
      assert.equal(new Set(videoIds).size, videoIds.length, `${entry.path}: duplicated video ID`);
      assert.ok(videoIds.length <= (entry.path === "/" ? 6 : 4));
      await section.scrollIntoViewIfNeeded();
      await section.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await section.screenshot({ path: join(output, `${entry.path === "/" ? "latest-videos" : "related-videos"}${mobile ? "-mobile" : ""}.jpg`),
        quality: 91 });
      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }
  await page.screenshot({ path: join(output, filename), fullPage: true, quality: 88, animations: "disabled" });
  await page.locator(bannerSelector).screenshot({ path: join(bannerDir, filename), quality: 91, animations: "disabled" });
  console.log(`${viewportWidth}px · ${filename} · ${entry.path}`);
}

try {
  if (enabled === "share") await captureShare();
  for (const directory of [output, bannerDir, motionDir]) mkdirSync(directory, { recursive: true });
  const faults = [];
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(120000);
    page.on("pageerror", (error) => faults.push(error.message));
    for (const entry of selectedEntries.filter((item) => enabled === "all" || enabled === item.group)) {
      await checkScreenshotPage(page, entry, width);
    }
    if (width === 1440 && (enabled === "all" || enabled === "interactions")) await checkNavigation(page);
    await context.close();
  }
  if (enabled === "all" || enabled === "interactions") {
    const motionPage = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
    motionPage.on("pageerror", (error) => faults.push(error.message));
    await checkMotion(motionPage);
    await checkSky(motionPage);
    await motionPage.close();
    console.log("Passed: archive search and sort, YouTube, Podcast, Email copy, platforms, audio controls and Canvas lifecycle.");
  }
  if (enabled === "all" || enabled === "motion") {
    await captureMotion(selectedEntries.filter((entry) => !entry.file.startsWith("case-") || /^case-00(?:01|10)-/.test(entry.file)));
  }
  assert.deepEqual(faults, [], "JavaScript errors");
} finally {
  await browser.close();
}

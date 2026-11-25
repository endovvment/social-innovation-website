"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ScrollMotion() {
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let smooth: Lenis | undefined;
    let frame = 0;
    const loop = (time: number) => {
      smooth?.raf(time);
      frame = requestAnimationFrame(loop);
    };
    function reset() {
      cancelAnimationFrame(frame);
      smooth?.destroy();
      smooth = undefined;
      if (media.matches) return;
      smooth = new Lenis({ lerp: 0.115, smoothWheel: true, syncTouch: false, anchors: { offset: -24 } });
      frame = requestAnimationFrame(loop);
    }
    reset();
    media.addEventListener("change", reset);
    return () => {
      media.removeEventListener("change", reset);
      cancelAnimationFrame(frame);
      smooth?.destroy();
    };
  }, []);
  return null;
}

export function RouteDust() {
  const path = usePathname();
  return <span aria-hidden="true" key={path} className="route-dust" />;
}

export function HeroTitle({ lines, label }: { lines: string[]; label: string }) {
  return <h1 className="hero-title" aria-label={label}>
    {lines.map((line, index) => <span className="hero-title-line" key={line} aria-hidden="true">
      <span className="title-phrase">{[...line].map((letter, i) => <motion.span key={i}
        initial={{ opacity: 0, y: 13 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: (index * 10 + i) * 0.027 }}>
        {letter}
      </motion.span>)}</span>
    </span>)}
  </h1>;
}

export function HeroAtmosphere({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const parent = node.parentElement;
    if (!parent) return;
    let mouseX = 0;
    let mouseY = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = Math.max(0, -parent.getBoundingClientRect().top);
      node.style.setProperty("--hero-x", query.matches ? "0px" : `${mouseX}px`);
      node.style.setProperty("--hero-y", query.matches ? "0px" : `${Math.min(14, mouseY + offset * .12)}px`);
      node.style.setProperty("--sky-opacity", query.matches ? "1" : String(1 - Math.min(0.4, offset / parent.clientHeight)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = parent.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width - 0.5) * 24;
      mouseY = ((event.clientY - rect.top) / rect.height - 0.5) * 16;
      schedule();
    };
    const leave = () => { mouseX = 0; mouseY = 0; schedule(); };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) window.addEventListener("scroll", schedule, { passive: true });
      else window.removeEventListener("scroll", schedule);
    });
    observer.observe(parent);
    parent.addEventListener("pointermove", move, { passive: true });
    parent.addEventListener("pointerleave", leave);
    query.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      parent.removeEventListener("pointermove", move);
      parent.removeEventListener("pointerleave", leave);
      query.removeEventListener("change", schedule);
    };
  }, []);
  return <div className="hero-atmosphere" ref={root}>{children}</div>;
}

export function IntroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const preference = useRef<"auto" | "on" | "off">("auto");
  const firstLap = useRef(true);
  const pausedByUser = useRef(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reduced, setReduced] = useState(true);

  function start(element: HTMLVideoElement, withSound: boolean) {
    if (!element.getAttribute("src")) element.src = "/assets/observer-intro.mp4";
    element.volume = 0.3;
    element.muted = !withSound;
    void element.play().catch((error: unknown) => {
      if (!(error instanceof DOMException) || error.name !== "NotAllowedError" ||
        !withSound || element.muted || pausedByUser.current) return;
      element.muted = true;
      void element.play().catch(() => {});
    });
  }

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setTimeout> | undefined;
    let soundFrame = 0;
    const refresh = () => {
      clearTimeout(timer);
      setReduced(query.matches);
      if (query.matches) {
        element.pause();
        element.loop = false;
        setReady(false);
      } else if (!pausedByUser.current) {
        timer = setTimeout(() => {
          if (!pausedByUser.current && element.paused) {
            start(element, preference.current === "on" || (preference.current === "auto" && firstLap.current));
          }
        }, 280);
      }
    };
    const fade = () => {
      if (element.paused || element.ended) return;
      const remaining = element.duration - element.currentTime;
      if (firstLap.current && preference.current === "auto" && !element.muted && remaining < 0.5) {
        element.volume = Math.max(0, remaining * 0.6);
      }
      soundFrame = requestAnimationFrame(fade);
    };
    const beginFade = () => { cancelAnimationFrame(soundFrame); fade(); };
    const endFade = () => cancelAnimationFrame(soundFrame);
    let triedScroll = false;
    const activate = (event: Event) => {
      if (query.matches || pausedByUser.current || !firstLap.current || preference.current !== "auto" || !element.muted ||
        (event.target instanceof Element && event.target.closest(".hero-controls"))) return;
      if (event.type === "wheel" || event.type === "scroll") {
        if (triedScroll) return;
        triedScroll = true;
      }
      start(element, true);
    };
    const events = ["click", "keydown", "wheel", "scroll"];
    refresh();
    element.addEventListener("playing", beginFade);
    element.addEventListener("pause", endFade);
    for (const event of events) window.addEventListener(event, activate, { passive: true });
    query.addEventListener("change", refresh);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(soundFrame);
      element.removeEventListener("playing", beginFade);
      element.removeEventListener("pause", endFade);
      query.removeEventListener("change", refresh);
      for (const event of events) window.removeEventListener(event, activate);
    };
  }, []);

  function finish(element: HTMLVideoElement) {
    firstLap.current = false;
    element.muted = preference.current !== "on";
    element.volume = 0.3;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPlaying(false);
      setReady(false);
      return;
    }
    element.loop = true;
    element.currentTime = 0;
    start(element, preference.current === "on");
  }

  return <>
    <video ref={video} className={`hero-video ${ready ? "is-ready" : ""}`}
      poster="/assets/observer-poster.webp" muted playsInline preload="none"
      aria-hidden="true" onPlaying={() => { setReady(true); setPlaying(true); }}
      onPause={() => setPlaying(false)} onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
      onEnded={(event) => finish(event.currentTarget)} />
    <div className="hero-controls">
      <button className="video-toggle" type="button" onClick={() => {
        const element = video.current;
        if (!element) return;
        pausedByUser.current = !element.paused;
        if (pausedByUser.current) {
          element.pause();
          if (reduced) setReady(false);
        } else {
          element.loop = !reduced && !firstLap.current;
          start(element, preference.current === "on" || (firstLap.current && preference.current === "auto"));
        }
      }}>
        <span aria-hidden="true" className={playing ? "pause-icon" : "play-icon"} />
        {playing ? "暫停開場動畫" : "播放開場動畫"}
      </button>
      {(!reduced || playing) && <button className="video-toggle" type="button" onClick={() => {
        const element = video.current;
        if (!element) return;
        preference.current = element.muted ? "on" : "off";
        element.muted = preference.current === "off";
        element.volume = 0.3;
        if (!element.paused) start(element, !element.muted);
      }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4z" />
          {muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12" />}
        </svg>
        {muted ? "開啟聲音" : "關閉聲音"}
      </button>}
    </div>
  </>;
}

export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <motion.div className={`motion-reveal ${className}`}
    initial={{ opacity: 0, y: 22 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.48, ease: "easeOut" }}>{children}</motion.div>;
}

export function CaseReveal({ number, children, className = "" }: { number?: string; children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useLayoutEffect(() => {
    const cover = root.current?.querySelector(".archive-cover");
    if (!cover || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.intersectionRatio < .12) return;
      setSeen(true);
      observer.disconnect();
    }, { threshold: 0.12 });
    cover.setAttribute("data-aperture", "");
    observer.observe(cover);
    return () => { observer.disconnect(); cover.removeAttribute("data-aperture"); };
  }, []);
  return <div ref={root} className={`case-reveal ${className}${seen ? " is-focused" : ""}`}>
    {number && <span className={`case-type ${seen ? "has-entered" : ""}`}>CASE {number}</span>}
    {children}
  </div>;
}

export function PinnedGallery({ children, revision }: { children: ReactNode; revision: string }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!wrapper.current || !track.current) return;
    const outer = wrapper.current;
    const inner = track.current;
    gsap.registerPlugin(ScrollTrigger);
    const queries = gsap.matchMedia();
    queries.add("(min-width: 1000px) and (prefers-reduced-motion: no-preference)", () => {
      const distance = () => Math.max(0, inner.scrollWidth - outer.clientWidth);
      if (!distance()) return;
      gsap.to(inner, {
        x: () => -distance(), ease: "none",
        scrollTrigger: {
          trigger: outer, start: "top 9%", end: () => `+=${distance()}`,
          scrub: 0.55, pin: true, invalidateOnRefresh: true,
        },
      });
    });
    return () => queries.revert();
  }, [revision]);
  return <div className="pin-window" ref={wrapper}><div className="pin-track" ref={track}>{children}</div></div>;
}

export function Timeline({ steps }: { steps: { title: string; detail: string }[] }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    if (!list.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-lit");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.66 });
    for (const item of list.current.children) observer.observe(item);
    return () => observer.disconnect();
  }, []);
  return <ol className="timeline" ref={list}>
    {steps.map((step, i) => <li key={step.title}>
      <span className="timeline-number mono">{String(i + 1).padStart(2, "0")}</span>
      <div><h3>{step.title}</h3><p>{step.detail}</p></div>
    </li>)}
  </ol>;
}

export function rememberCover(event: MouseEvent<HTMLAnchorElement>, slug: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const image = event.currentTarget.querySelector("img");
  if (!image) return;
  const { x, y, width, height } = image.getBoundingClientRect();
  try { sessionStorage.setItem("archive-cover", JSON.stringify({ slug, x, y, width, height, time: Date.now() })); } catch {}
}

export function CaseHeroMotion({ slug, children }: { slug: string; children: ReactNode }) {
  const cover = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const element = cover.current;
    if (!element) return;
    try {
      const from = JSON.parse(sessionStorage.getItem("archive-cover") || "null");
      sessionStorage.removeItem("archive-cover");
      if (!from || from.slug !== slug || Date.now() - from.time > 1500) return;
      const to = element.getBoundingClientRect();
      if (!to.width || !to.height) return;
      const animation = element.animate([
        { transformOrigin: "top left", transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})` },
        { transformOrigin: "top left", transform: "none" },
      ], { duration: 375, easing: "cubic-bezier(.2,.7,.2,1)" });
      return () => animation.cancel();
    } catch { /* navigation still works when storage is unavailable */ }
  }, [slug]);
  return <div ref={cover} className="case-hero-media">{children}</div>;
}

export function FooterObserver({ children }: { children: ReactNode }) {
  const path = usePathname();
  if (path === "/collaborate") return null;
  return <span className="footer-observer" onPointerMove={(event) => {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--turn", `${(event.clientX - rect.left - rect.width / 2) / 4}deg`);
  }} onPointerLeave={(event) => event.currentTarget.style.setProperty("--turn", "0deg")}>{children}</span>;
}

export function FooterMark({ children }: { children: ReactNode }) {
  return usePathname() === "/collaborate" ? null : children;
}

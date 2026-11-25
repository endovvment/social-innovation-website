"use client";

import { useEffect, useRef } from "react";
import { makeSkyScene, type SkyVariant } from "./night-sky-scene";

export function NightSky({ variant, caseNumber = 0 }: { variant: SkyVariant; caseNumber?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const foreground = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const foregroundCanvas = foreground.current;
    const context = canvas?.getContext("2d");
    const front = foregroundCanvas?.getContext("2d") ?? context;
    const banner = canvas?.closest<HTMLElement>(".sky-banner, .case-hero, .home-hero");
    if (!canvas || !context || !front || !banner) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let dirty = true;
    let frame = 0;
    let previous = 0;
    let nextDraw = 0;
    let time = 0;
    let currentX = 0;
    let currentY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let descent = 0;
    let scene: ReturnType<typeof makeSkyScene>;
    const frameInterval = 1000 / 60;

    const rebuild = () => {
      const { width: layoutWidth, height: layoutHeight } = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(layoutWidth));
      const height = Math.max(1, Math.round(layoutHeight));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (foregroundCanvas) {
        foregroundCanvas.width = canvas.width;
        foregroundCanvas.height = canvas.height;
        front.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      scene = makeSkyScene(context, front, variant, width, height, caseNumber);
      dirty = false;
    };

    const animate = (now: number) => {
      if (!visible || document.hidden) return;
      if (previous) time += Math.min(now - previous, 100) / 1000;
      previous = now;
      if (!nextDraw || dirty || now + 1 >= nextDraw) {
        if (dirty) rebuild();
        const quiet = reduced.matches;
        currentX = quiet ? 0 : currentX + (mouseX - currentX) * .08;
        const targetY = Math.max(-14, Math.min(14, mouseY + descent));
        currentY = quiet ? 0 : currentY + (targetY - currentY) * .08;
        scene(time, quiet, currentX, currentY);
        nextDraw = Math.max(nextDraw + frameInterval, now + 2);
      }
      frame = requestAnimationFrame(animate);
    };

    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      nextDraw = 0;
      if (visible && !document.hidden) frame = requestAnimationFrame(animate);
    };
    const scroll = () => {
      if (visible && !document.hidden && !reduced.matches) {
        descent = Math.min(14, Math.max(0, -banner.getBoundingClientRect().top) * .13);
      }
    };
    const pointer = (event: PointerEvent) => {
      if (!visible || document.hidden || reduced.matches || event.pointerType !== "mouse") return;
      const box = banner.getBoundingClientRect();
      mouseX = ((event.clientX - box.left) / box.width - .5) * 27;
      mouseY = ((event.clientY - box.top) / box.height - .5) * 16;
    };
    const leave = () => { mouseX = 0; mouseY = 0; };
    const preference = () => { leave(); descent = 0; scroll(); sync(); };
    const resize = new ResizeObserver(() => { dirty = true; });
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      scroll();
      sync();
    });
    resize.observe(canvas);
    intersection.observe(canvas);
    window.addEventListener("resize", sizeChanged, { passive: true });
    window.addEventListener("scroll", scroll, { passive: true });
    banner.addEventListener("pointermove", pointer, { passive: true });
    banner.addEventListener("pointerleave", leave);
    reduced.addEventListener("change", preference);
    document.addEventListener("visibilitychange", sync);
    function sizeChanged() { dirty = true; }
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      intersection.disconnect();
      window.removeEventListener("resize", sizeChanged);
      window.removeEventListener("scroll", scroll);
      banner.removeEventListener("pointermove", pointer);
      banner.removeEventListener("pointerleave", leave);
      reduced.removeEventListener("change", preference);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [variant, caseNumber]);

  return <>
    <canvas ref={ref} className="night-sky" data-sky={variant} aria-hidden="true" />
    {variant === "home" && <canvas ref={foreground} className="night-sky sky-trail" aria-hidden="true" />}
  </>;
}

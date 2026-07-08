"use client";

import { useEffect, useRef } from "react";

/**
 * Motes — dust drifting through lamplight, drawn on a 2D canvas.
 * A handful of warm and cool specks that rise, sway, and twinkle.
 */
export default function Motes({ density = 42 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    type Mote = {
      x: number;
      y: number;
      r: number;
      vy: number;
      sway: number;
      phase: number;
      twinkle: number;
      warm: boolean;
    };

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    let motes: Mote[] = [];

    const seed = (initial: boolean): Mote => ({
      x: Math.random(),
      y: initial ? Math.random() : 1.05,
      r: 0.5 + Math.random() * 1.4,
      vy: 0.008 + Math.random() * 0.02,
      sway: 6 + Math.random() * 22,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.4 + Math.random() * 0.6,
      warm: Math.random() > 0.3,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    motes = Array.from({ length: density }, () => seed(true));

    let last = performance.now();
    const tick = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        m.y -= m.vy * dt * 6;
        m.phase += dt * 0.6;
        if (m.y < -0.05) motes[i] = seed(false);

        const x = m.x * w + Math.sin(m.phase) * m.sway;
        const y = m.y * h;
        const a =
          (0.12 + 0.5 * Math.abs(Math.sin(m.phase * m.twinkle))) *
          Math.min(1, (1.05 - m.y) * 4) *
          Math.min(1, m.y * 6 + 0.15);

        ctx.beginPath();
        ctx.arc(x, y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = m.warm
          ? `rgba(228, 201, 138, ${a})`
          : `rgba(158, 178, 214, ${a * 0.7})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

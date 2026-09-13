"use client";

import { useEffect, useRef } from "react";

/**
 * InkCursor — a nib, and the ink it leaves behind.
 *
 * Desktop only (pointer: fine), and never under reduced motion. One canvas,
 * one loop, paused when the tab is hidden or the pointer leaves the window.
 * The trail fades on its own so there is nothing to clean up.
 */

type Point = { x: number; y: number; life: number };

export default function InkCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (!fine || reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;
    let inside = false;
    const pointer = { x: -100, y: -100 };
    const nib = { x: -100, y: -100 };
    const trail: Point[] = [];

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();

    const draw = () => {
      raf = 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // the nib lags the pointer very slightly, the way a hand does
      nib.x += (pointer.x - nib.x) * 0.34;
      nib.y += (pointer.y - nib.y) * 0.34;

      if (inside) {
        const moved = Math.hypot(pointer.x - nib.x, pointer.y - nib.y);
        if (moved > 0.6) trail.push({ x: nib.x, y: nib.y, life: 1 });
      }

      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.035;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life * 0.3;
        ctx.fillStyle = "#E8B15C";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.1 + p.life * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (trail.length > 90) trail.splice(0, trail.length - 90);

      if (inside) {
        // the nib itself: a small filled quill point
        ctx.globalAlpha = 0.92;
        ctx.save();
        ctx.translate(nib.x, nib.y);
        ctx.rotate(-0.5);
        ctx.fillStyle = "#F1E9D9";
        ctx.beginPath();
        ctx.moveTo(0, -8.5);
        ctx.lineTo(3.6, 3);
        ctx.lineTo(0, 6.5);
        ctx.lineTo(-3.6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(20,27,48,0.75)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(0, 4);
        ctx.stroke();
        ctx.restore();
      }

      ctx.globalAlpha = 1;
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };

    const resume = () => {
      if (raf || document.hidden) return;
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!inside) {
        inside = true;
        nib.x = e.clientX;
        nib.y = e.clientY;
      }
      resume();
    };
    const onLeave = () => {
      inside = false;
      resume();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else resume();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    resume();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[95] hidden [@media(pointer:fine)]:block"
    />
  );
}

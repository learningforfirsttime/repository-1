"use client";

import { useEffect, useRef } from "react";
import Doll from "./Doll";

/**
 * The doll, as three drawn frames.
 *
 * Greeting → mid-bow → full bow, crossfaded against the same scroll value and
 * the same easing curve that drove the vector rig, so the gesture keeps the
 * site's timing. Because the three frames are drawn separately rather than
 * posed from one rig, their hems and ribbon tails do not land in identical
 * places; the blend is paired with a small downward drift so the eye reads
 * motion rather than a dissolve.
 *
 * If the frames are not present, this renders the vector doll instead — the
 * page is never blank and never waits on a file.
 *
 * Drop the artwork at these exact paths (Next serves `public/` from the site
 * root, so `public/doll/greeting.webp` is `/doll/greeting.webp`):
 */
const FRAMES = [
  "/doll/greeting.webp", // upright, meeting the visitor's eyes
  "/doll/bow-mid.webp", // head beginning to lower, eyes softening
  "/doll/bow-full.webp", // head down, eyes closed
] as const;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (t: number) => t * t * (3 - 2 * t);

type Props = {
  heroId?: string;
  className?: string;
  /**
   * Whether all three frames are actually on disk. Decided at build time by
   * the page, not probed at runtime — asking the browser meant three 404s in
   * the console on every visit while the artwork was missing.
   */
  hasFrames?: boolean;
};

export default function DollFrames({
  heroId = "hero",
  className = "",
  hasFrames = false,
}: Props) {
  const haveFrames = hasFrames;
  const layers = useRef<(HTMLImageElement | null)[]>([null, null, null]);
  const stage = useRef<HTMLDivElement | null>(null);

  // The rig: one scroll value, three opacities, written straight to the nodes.
  useEffect(() => {
    if (!haveFrames) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let target = 0;
    let bow = 0;
    let last = performance.now();

    const readScroll = () => {
      const hero = document.getElementById(heroId);
      if (!hero) {
        target = 0;
        return;
      }
      const span = hero.offsetHeight - window.innerHeight;
      target = span > 0 ? clamp01(window.scrollY / span) : 0;
    };

    const apply = (p: number, now: number) => {
      const e = smooth(p);
      // two segments: greeting → mid, then mid → full
      const seg = e * 2;
      const op =
        seg <= 1
          ? [1 - seg, seg, 0]
          : [0, 2 - seg, seg - 1];

      for (let i = 0; i < 3; i++) {
        const node = layers.current[i];
        if (node) node.style.opacity = String(op[i]);
      }

      if (stage.current) {
        // she settles a little as she bows, and breathes while she waits
        const breath = reduced ? 0 : Math.sin(now * 0.0011) * 0.22 * (1 - e);
        stage.current.style.transform = `translateY(${e * 1.6 + breath}%)`;
      }
    };

    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);

    if (reduced) {
      // a discrete, gentle state change instead of a scrub
      const applyReduced = () => apply(target > 0.35 ? 1 : 0, 0);
      applyReduced();
      window.addEventListener("scroll", applyReduced, { passive: true });
      return () => {
        window.removeEventListener("scroll", readScroll);
        window.removeEventListener("resize", readScroll);
        window.removeEventListener("scroll", applyReduced);
      };
    }

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(64, now - last);
      last = now;
      bow += (target - bow) * (1 - Math.exp(-dt / 130));
      apply(bow, now);
      raf = requestAnimationFrame(frame);
    };
    const resume = () => {
      if (raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    resume();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", readScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [haveFrames, heroId]);

  // Whenever the frames are absent, she is drawn in code instead.
  if (!haveFrames) {
    return <Doll heroId={heroId} className={className} />;
  }

  return (
    <div
      ref={stage}
      className={`relative aspect-[2/3] ${className}`}
      role="img"
      aria-label="Your Auto Memory Doll, in a high-collared navy dress and cream apron, her hair in a braided crown. As you scroll, she bows to greet you."
    >
      {FRAMES.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is
        // deliberately not used here: these are fixed, locally served frames
        // and the crossfade needs direct control of each element's opacity.
        <img
          key={src}
          ref={(el) => {
            layers.current[i] = el;
          }}
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          fetchPriority={i === 0 ? "high" : "low"}
          className="absolute inset-0 h-full w-full select-none object-contain object-bottom"
          style={{ opacity: i === 0 ? 1 : 0, willChange: "opacity" }}
        />
      ))}
    </div>
  );
}

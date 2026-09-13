"use client";

import { useEffect, useRef } from "react";

/**
 * The doll herself — an articulated vector figure, not a picture of one.
 *
 * She is drawn once and rigged: a squash pivot at the hips, a second at the
 * neck, and sub-pivots for features, crown, bangs, ribbon and earrings. One
 * scroll-linked value drives all of them, so the bow is a continuous gesture
 * at any scroll speed rather than a crossfade between frames. Nothing here
 * re-renders — the rig writes transforms straight to the nodes.
 *
 * Her palette is the room's: candlelight hair, moonpaper blouse, an ink and
 * slate skirt, a rose the colour of sealing wax, and aether at the ears.
 */

type Props = {
  /** id of the scroll container that drives the bow */
  heroId?: string;
  className?: string;
};

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const smooth = (t: number) => t * t * (3 - 2 * t);

export default function Doll({ heroId = "hero", className = "" }: Props) {
  const rootRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = rootRef.current;
    if (!svg) return;

    const q = <T extends SVGElement>(id: string) =>
      svg.querySelector<T>(`#${id}`);

    const upper = q<SVGGElement>("doll-upper");
    const head = q<SVGGElement>("doll-head");
    const features = q<SVGGElement>("doll-features");
    const crown = q<SVGGElement>("doll-crown");
    const bangs = q<SVGGElement>("doll-bangs");
    const ribbon = q<SVGGElement>("doll-ribbon");
    const lidL = q<SVGGElement>("doll-lid-l");
    const lidR = q<SVGGElement>("doll-lid-r");
    const lashes = q<SVGGElement>("doll-lashes");
    const earL = q<SVGGElement>("doll-ear-l");
    const earR = q<SVGGElement>("doll-ear-r");
    if (!upper || !head || !features || !crown || !bangs || !ribbon) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let raf = 0;
    let target = 0;
    let bow = 0;
    let lastBow = 0;
    let blink = 0;
    let last = performance.now();
    let nextBlink = last + 2600;
    const earVel = { l: 0, r: 0 };
    const earAng = { l: 0, r: 0 };

    const readScroll = () => {
      const hero = document.getElementById(heroId);
      if (!hero) {
        target = 0;
        return;
      }
      const span = hero.offsetHeight - window.innerHeight;
      target = span > 0 ? clamp01(window.scrollY / span) : 0;
    };

    const pose = (p: number, now: number) => {
      const e = smooth(p);
      // she breathes while she waits, and stops breathing while she bows
      const breath = reduced ? 0 : Math.sin(now * 0.0011) * 1.4 * (1 - e);

      upper.style.transform = `translateY(${e * 34 + breath}px) scale(${
        1 + e * 0.025
      }, ${1 - e * 0.22})`;
      // depth reads as foreshortening, not as the head sliding between shoulders
      head.style.transform = `translateY(${e * 28}px) scaleY(${1 - e * 0.17})`;
      features.style.transform = `translateY(${e * 17}px) scaleY(${
        1 - e * 0.1
      })`;
      crown.style.transform = `translateY(${e * 7}px) scale(${1 + e * 0.11})`;
      bangs.style.transform = `translateY(${e * 7}px)`;
      ribbon.style.transform = `translateY(${e * 14}px) scaleX(${1 - e * 0.15})`;

      // the lids meet the lower lash at the deepest point of the bow
      const lidDown = Math.max(e * 24, blink * 22);
      if (lidL) lidL.style.transform = `translateY(${lidDown}px)`;
      if (lidR) lidR.style.transform = `translateY(${lidDown}px)`;
      if (lashes)
        lashes.style.opacity = String(1 - Math.max(e * 0.9, blink * 0.85));

      if (reduced) {
        if (earL) earL.style.transform = "";
        if (earR) earR.style.transform = "";
        return;
      }

      // earrings: damped pendulums, kicked by the bow's own velocity
      const kick = (e - lastBow) * 260;
      lastBow = e;
      const sides: Array<["l" | "r", SVGGElement | null, number]> = [
        ["l", earL, 1],
        ["r", earR, 0.85],
      ];
      for (const [key, node, gain] of sides) {
        if (!node) continue;
        const idle =
          Math.sin(now * 0.0016 + (key === "l" ? 0 : 1.4)) * 2.2 * (1 - e * 0.5);
        earVel[key] += -earAng[key] * 0.055 + kick * gain;
        earVel[key] *= 0.92;
        earAng[key] += earVel[key];
        const a = Math.max(-24, Math.min(24, earAng[key] + idle));
        node.style.transform = `rotate(${a}deg)`;
      }
    };

    const frame = (now: number) => {
      raf = 0;
      if (document.hidden) return;
      const dt = Math.min(64, now - last);
      last = now;
      // refresh-rate independent easing
      bow += (target - bow) * (1 - Math.exp(-dt / 130));

      if (now >= nextBlink) {
        const phase = (now - nextBlink) / 200;
        if (phase >= 1) {
          blink = 0;
          nextBlink = now + 3200 + Math.random() * 2800;
        } else {
          blink = bow > 0.55 ? 0 : Math.sin(phase * Math.PI);
        }
      }

      pose(bow, now);
      raf = requestAnimationFrame(frame);
    };

    const resume = () => {
      if (reduced || raf || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    readScroll();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", readScroll);

    if (reduced) {
      // a discrete, gentle state change instead of a scrub
      const applyReduced = () => {
        bow = target > 0.35 ? 1 : 0;
        pose(bow, 0);
      };
      applyReduced();
      window.addEventListener("scroll", applyReduced, { passive: true });
      return () => {
        window.removeEventListener("scroll", readScroll);
        window.removeEventListener("resize", readScroll);
        window.removeEventListener("scroll", applyReduced);
      };
    }

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
  }, [heroId]);

  return (
    <svg
      ref={rootRef}
      viewBox="0 0 440 780"
      className={className}
      role="img"
      aria-label="Your Auto Memory Doll: a young woman in a high-collared ruffled blouse and a dark indigo skirt, her golden hair braided into a crown with a deep red rose. As you scroll, she bows to greet you."
    >
      <defs>
        <linearGradient id="d-skirt" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A4874" />
          <stop offset="0.45" stopColor="#28324F" />
          <stop offset="1" stopColor="#141B30" />
        </linearGradient>
        <linearGradient id="d-blouse" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6F0E4" />
          <stop offset="1" stopColor="#E2D6C0" />
        </linearGradient>
        <linearGradient id="d-hair" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0CD8A" />
          <stop offset="1" stopColor="#D9A855" />
        </linearGradient>
        <linearGradient id="d-iris" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A3A6E" />
          <stop offset="0.45" stopColor="#5A6BC0" />
          <stop offset="1" stopColor="#9FB0EE" />
        </linearGradient>
        <radialGradient id="d-cheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#D98A82" stopOpacity="0.45" />
          <stop offset="1" stopColor="#D98A82" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="d-gem" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#BFC8F5" />
          <stop offset="0.55" stopColor="#7C86D8" />
          <stop offset="1" stopColor="#39407A" />
        </radialGradient>
        <clipPath id="d-eye-l">
          <path d="M 182 163 C 186 152, 206 150, 212 160 C 211 172, 188 174, 182 163 Z" />
        </clipPath>
        <clipPath id="d-eye-r">
          <path d="M 258 163 C 254 152, 234 150, 228 160 C 229 172, 252 174, 258 163 Z" />
        </clipPath>
      </defs>

      <ellipse cx="220" cy="726" rx="128" ry="14" fill="#000000" opacity="0.42" />

      {/* ───── lower body: still while she bows ───── */}
      <g id="doll-lower">
        <path
          d="M 196 694 C 192 706, 192 712, 197 716 L 216 716 L 216 694 Z"
          fill="#0E1526"
        />
        <path
          d="M 244 694 C 248 706, 248 712, 243 716 L 224 716 L 224 694 Z"
          fill="#0E1526"
        />
        <path
          d="M 172 420 C 158 496, 128 594, 102 686 C 118 698, 156 707, 220 707 C 284 707, 322 698, 338 686 C 312 594, 282 496, 268 420 Z"
          fill="url(#d-skirt)"
        />
        <g fill="#0F1527" opacity="0.5">
          <path
            d="M 196 434 C 188 520, 172 612, 158 688 C 164 692, 170 694, 176 696 C 188 612, 200 520, 206 434 Z"
            opacity="0.45"
          />
          <path
            d="M 244 434 C 252 520, 268 612, 282 688 C 276 692, 270 694, 264 696 C 252 612, 240 520, 234 434 Z"
            opacity="0.45"
          />
          <path
            d="M 220 436 C 219 530, 219 620, 219 700 C 222 700, 224 700, 227 700 C 226 620, 224 530, 224 436 Z"
            opacity="0.35"
          />
        </g>
        <path
          d="M 178 440 C 168 510, 150 600, 132 672 C 136 676, 141 678, 146 680 C 162 604, 176 512, 184 442 Z"
          fill="#5A6BA8"
          opacity="0.26"
        />
        <path
          d="M 102 686 C 118 698, 156 707, 220 707 C 284 707, 322 698, 338 686 L 341 697 C 322 709, 285 718, 220 718 C 155 718, 118 709, 99 697 Z"
          fill="#4A5893"
          opacity="0.9"
        />
        <path
          d="M 108 692 q 7 9 14 2 q 7 9 14 2.5 q 7 8.5 14 2.5 q 7 8 14 2.5 q 7 8 14 2 q 7 8 14 2 q 7 7.5 14 1.5 q 7 7.5 14 0.5 q 7 7 14 0 q 7 6.5 14 -0.5 q 7 6 14 -1.5 q 7 6 14 -2 q 7 5.5 14 -2.5 q 7 5 14 -3 q 7 5 14 -3.5 q 7 4.5 14 -4.5"
          fill="none"
          stroke="#18203A"
          strokeWidth="1.2"
          opacity="0.85"
        />
        <line
          x1="112"
          y1="682"
          x2="330"
          y2="682"
          stroke="#7C86D8"
          strokeWidth="1.2"
          opacity="0.4"
        />
        {/* candlelight catches the right side of the skirt */}
        <path
          d="M 268 424 C 282 500, 310 596, 334 682 C 331 685, 327 687, 323 689 C 300 600, 274 504, 262 426 Z"
          fill="#E8B15C"
          opacity="0.2"
        />
      </g>

      {/* ───── upper body: the bow rig ───── */}
      <g id="doll-upper" style={{ transformOrigin: "220px 430px" }}>
        {/* high waist, moving with the torso so the tuck never opens */}
        <path
          d="M 176 384 C 172 402, 170 420, 170 438 C 202 448, 238 448, 270 438 C 270 420, 268 402, 264 384 C 236 376, 204 376, 176 384 Z"
          fill="#28324F"
        />
        <path
          d="M 176 384 C 204 392, 236 392, 264 384 C 264 388, 265 392, 265 396 C 236 404, 204 404, 175 396 Z"
          fill="#3A4874"
          opacity="0.7"
        />
        <g>
          {[404, 420, 436].map((y) => (
            <g key={`bl-${y}`}>
              <circle cx="203" cy={y} r="3.4" fill="#A98B4F" />
              <circle cx="202" cy={y - 1} r="1.2" fill="#F0CD8A" />
            </g>
          ))}
          {[404, 420, 436].map((y) => (
            <g key={`br-${y}`}>
              <circle cx="237" cy={y} r="3.4" fill="#A98B4F" />
              <circle cx="236" cy={y - 1} r="1.2" fill="#F0CD8A" />
            </g>
          ))}
        </g>

        {/* bodice */}
        <path
          d="M 152 278 C 146 316, 162 352, 176 388 C 204 397, 236 397, 264 388 C 278 352, 294 316, 288 278 C 268 262, 240 254, 220 254 C 200 254, 172 262, 152 278 Z"
          fill="url(#d-blouse)"
        />
        <path
          d="M 152 278 C 146 316, 162 352, 176 388 C 182 390, 188 392, 194 393 C 178 354, 166 318, 170 282 C 164 280, 158 279, 152 278 Z"
          fill="#C9BBA6"
          opacity="0.5"
        />
        <path
          d="M 288 278 C 294 316, 278 352, 264 388 C 260 389, 256 390, 252 391 C 266 352, 276 318, 272 284 C 278 282, 283 280, 288 278 Z"
          fill="#FFE9C4"
          opacity="0.4"
        />

        {/* puffed shoulders */}
        <path
          d="M 150 284 C 140 268, 146 252, 162 246 C 172 242, 182 246, 186 254 C 176 260, 162 270, 150 284 Z"
          fill="url(#d-blouse)"
        />
        <path
          d="M 290 284 C 300 268, 294 252, 278 246 C 268 242, 258 246, 254 254 C 264 260, 278 270, 290 284 Z"
          fill="url(#d-blouse)"
        />

        {/* sleeves */}
        <path
          d="M 152 280 C 140 306, 136 330, 140 352 C 148 358, 158 360, 164 358 C 168 332, 172 308, 178 288 C 170 282, 160 279, 152 280 Z"
          fill="url(#d-blouse)"
        />
        <path
          d="M 288 280 C 300 306, 304 330, 300 352 C 292 358, 282 360, 276 358 C 272 332, 268 308, 262 288 C 270 282, 280 279, 288 280 Z"
          fill="url(#d-blouse)"
        />
        <path
          d="M 152 280 C 140 306, 136 330, 140 352 C 143 354, 146 356, 150 357 C 146 332, 150 306, 158 284 C 156 282, 154 281, 152 280 Z"
          fill="#C9BBA6"
          opacity="0.5"
        />
        <path
          d="M 140 350 C 146 372, 162 386, 186 394 L 200 384 C 180 374, 166 362, 162 348 C 154 352, 146 353, 140 350 Z"
          fill="url(#d-blouse)"
        />
        <path
          d="M 300 350 C 294 372, 278 386, 254 394 L 240 384 C 260 374, 274 362, 278 348 C 286 352, 294 353, 300 350 Z"
          fill="url(#d-blouse)"
        />

        {/* lace cuffs */}
        <g fill="#F6F0E4" stroke="#BFAE9B" strokeWidth="1">
          <path d="M 184 380 q 6 -8 12 -2 q 6 -8 11 -1 q 6 -8 10 1 q -8 12 -18 14 q -10 -2 -15 -12 Z" />
          <path d="M 256 380 q -6 -8 -12 -2 q -6 -8 -11 -1 q -6 -8 -10 1 q 8 12 18 14 q 10 -2 15 -12 Z" />
        </g>

        {/* hands, folded */}
        <g>
          <path
            d="M 204 384 C 212 378, 228 378, 236 384 C 240 390, 240 398, 234 403 C 226 408, 214 408, 206 403 C 200 398, 200 390, 204 384 Z"
            fill="#F7E2D2"
          />
          <path
            d="M 208 398 C 214 401, 226 401, 232 398"
            stroke="#D9A98D"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 210 388 C 214 386, 218 386, 221 388 M 224 387 C 227 386, 230 386, 233 388"
            stroke="#D9A98D"
            strokeWidth="1.1"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* front placket */}
        <g fill="#F6F0E4" stroke="#C4B3A5" strokeWidth="1">
          <path d="M 206 258 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -8 6 -1 13 q -7 6 -1 12 l 10 3 L 212 260 Z" />
          <path d="M 234 258 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 8 6 1 13 q 7 6 1 12 l -10 3 L 228 260 Z" />
        </g>
        <g>
          {[296, 322, 348].map((y) => (
            <g key={`pb-${y}`}>
              <circle cx="220" cy={y} r="2.8" fill="#A98B4F" />
              <circle cx="219" cy={y - 1} r="1" fill="#F0CD8A" />
            </g>
          ))}
        </g>
        <path
          d="M 284 284 C 290 316, 278 350, 266 384 C 264 385, 262 386, 260 386 C 272 350, 282 318, 278 288 Z"
          fill="#E8B15C"
          opacity="0.32"
        />

        {/* neck */}
        <path
          d="M 206 218 C 207 234, 208 246, 206 254 C 214 260, 226 260, 234 254 C 232 246, 233 234, 234 218 Z"
          fill="#F7E2D2"
        />
        <path
          d="M 206 224 C 210 232, 216 236, 220 237 C 224 236, 230 232, 234 224 L 234 218 L 206 218 Z"
          fill="#E4BCA4"
          opacity="0.8"
        />

        {/* collar ruffle */}
        <g fill="#F6F0E4" stroke="#BFAE9B" strokeWidth="1.1">
          <path
            d="M 190 244 q -12 2 -10 12 q 8 6 16 2 q -2 8 8 10 q 8 -2 10 -8 q 2 8 12 8 q 8 -4 6 -10 q 8 4 14 -2 q 4 -8 -4 -12 q 8 -6 0 -12 q -10 -4 -14 2 q 0 -8 -10 -8 q -8 2 -8 8 q -4 -8 -12 -6 q -8 4 -6 10 q -8 -2 -12 6 Z"
            transform="translate(0,4)"
          />
        </g>
        <path
          d="M 204 244 C 210 252, 230 252, 236 244 L 236 252 C 230 258, 210 258, 204 252 Z"
          fill="#D8CABB"
        />

        {/* ribbon tie and brooch — follows the chin partway through the bow */}
        <g id="doll-ribbon" style={{ transformOrigin: "220px 268px" }}>
          <path
            d="M 214 262 C 200 254, 188 256, 184 266 C 182 276, 192 282, 204 278 C 210 276, 214 270, 214 262 Z"
            fill="#141B30"
          />
          <path
            d="M 226 262 C 240 254, 252 256, 256 266 C 258 276, 248 282, 236 278 C 230 276, 226 270, 226 262 Z"
            fill="#141B30"
          />
          <path
            d="M 214 262 C 204 258, 194 260, 190 266 C 194 272, 204 274, 212 270 Z"
            fill="#28324F"
            opacity="0.85"
          />
          <path
            d="M 226 262 C 236 258, 246 260, 250 266 C 246 272, 236 274, 228 270 Z"
            fill="#28324F"
            opacity="0.85"
          />
          <path
            d="M 212 276 C 208 292, 206 306, 208 318 L 216 320 C 216 306, 216 292, 218 278 Z"
            fill="#141B30"
          />
          <path
            d="M 228 276 C 232 292, 234 306, 232 318 L 224 320 C 224 306, 224 292, 222 278 Z"
            fill="#141B30"
          />
          <ellipse cx="220" cy="268" rx="11" ry="12" fill="#141B30" />
          <ellipse
            cx="220"
            cy="268"
            rx="8.5"
            ry="9.5"
            fill="none"
            stroke="#A98B4F"
            strokeWidth="1.6"
          />
          <circle cx="220" cy="268" r="5.4" fill="url(#d-gem)" />
          <circle cx="218" cy="265.5" r="1.6" fill="#E8ECFF" opacity="0.9" />
        </g>

        {/* ───── head ───── */}
        <g id="doll-head" style={{ transformOrigin: "220px 244px" }}>
          <path
            d="M 158 118 C 148 160, 152 198, 166 224 C 172 232, 180 236, 186 236 C 176 200, 172 160, 178 124 Z"
            fill="#C99A4B"
          />
          <path
            d="M 282 118 C 292 160, 288 198, 274 224 C 268 232, 260 236, 254 236 C 264 200, 268 160, 262 124 Z"
            fill="#C99A4B"
          />

          <ellipse cx="177" cy="172" rx="7" ry="11" fill="#F7E2D2" />
          <ellipse cx="263" cy="172" rx="7" ry="11" fill="#F7E2D2" />

          <g id="doll-ear-l" style={{ transformOrigin: "177px 181px" }}>
            <circle cx="177" cy="181" r="3" fill="#A98B4F" />
            <line
              x1="177"
              y1="183"
              x2="177"
              y2="195"
              stroke="#A98B4F"
              strokeWidth="1.6"
            />
            <path
              d="M 177 194 C 185.5 200, 186.5 212, 177 219 C 167.5 212, 168.5 200, 177 194 Z"
              fill="url(#d-gem)"
              stroke="#A98B4F"
              strokeWidth="1"
            />
            <circle cx="174" cy="202" r="1.8" fill="#E8ECFF" opacity="0.95" />
          </g>
          <g id="doll-ear-r" style={{ transformOrigin: "263px 181px" }}>
            <circle cx="263" cy="181" r="3" fill="#A98B4F" />
            <line
              x1="263"
              y1="183"
              x2="263"
              y2="195"
              stroke="#A98B4F"
              strokeWidth="1.6"
            />
            <path
              d="M 263 194 C 271.5 200, 272.5 212, 263 219 C 253.5 212, 254.5 200, 263 194 Z"
              fill="url(#d-gem)"
              stroke="#A98B4F"
              strokeWidth="1"
            />
            <circle cx="260" cy="202" r="1.8" fill="#E8ECFF" opacity="0.95" />
          </g>

          {/* an under-hair plate, so gaps between locks read as shade, not sky */}
          <path
            d="M 164 132 C 154 92, 176 60, 214 54 C 254 48, 288 70, 290 108 C 291 122, 286 134, 280 140 C 268 116, 246 104, 220 104 C 194 104, 174 116, 164 132 Z"
            fill="#6E5124"
          />
          <path
            d="M 168 134 C 166 118, 172 104, 184 96 C 176 112, 173 124, 174 138 Z"
            fill="#6E5124"
          />
          <path
            d="M 272 134 C 274 118, 270 104, 260 94 C 268 110, 271 122, 270 138 Z"
            fill="#6E5124"
          />

          <path
            d="M 176 112 C 171 148, 175 184, 189 206 C 199 220, 211 228, 220 228 C 229 228, 241 220, 251 206 C 265 184, 269 148, 264 112 C 252 92, 188 92, 176 112 Z"
            fill="#F7E2D2"
          />
          <path
            d="M 189 206 C 199 220, 211 228, 220 228 C 229 228, 241 220, 251 206 C 245 216, 232 223, 220 223 C 208 223, 195 216, 189 206 Z"
            fill="#E4BCA4"
            opacity="0.6"
          />

          <g id="doll-features" style={{ transformOrigin: "220px 190px" }}>
            <path
              d="M 185 141 C 191 137.5, 202 137, 209 139.5"
              stroke="#B98A52"
              strokeWidth="2.3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 255 141 C 249 137.5, 238 137, 231 139.5"
              stroke="#B98A52"
              strokeWidth="2.3"
              strokeLinecap="round"
              fill="none"
            />

            <path
              d="M 182 163 C 186 152, 206 150, 212 160 C 211 172, 188 174, 182 163 Z"
              fill="#fff"
            />
            <path
              d="M 258 163 C 254 152, 234 150, 228 160 C 229 172, 252 174, 258 163 Z"
              fill="#fff"
            />

            <g clipPath="url(#d-eye-l)">
              <circle cx="198" cy="164" r="9.4" fill="url(#d-iris)" />
              <circle
                cx="198"
                cy="164"
                r="9.4"
                fill="none"
                stroke="#232E5E"
                strokeWidth="1.4"
              />
              <circle cx="198" cy="165" r="4" fill="#1B2348" />
              <circle cx="195" cy="160" r="2.6" fill="#ffffff" />
              <circle cx="201.5" cy="168.5" r="1.3" fill="#D6DEFF" opacity="0.9" />
            </g>
            <g clipPath="url(#d-eye-r)">
              <circle cx="242" cy="164" r="9.4" fill="url(#d-iris)" />
              <circle
                cx="242"
                cy="164"
                r="9.4"
                fill="none"
                stroke="#232E5E"
                strokeWidth="1.4"
              />
              <circle cx="242" cy="165" r="4" fill="#1B2348" />
              <circle cx="239" cy="160" r="2.6" fill="#ffffff" />
              <circle cx="245.5" cy="168.5" r="1.3" fill="#D6DEFF" opacity="0.9" />
            </g>

            <g clipPath="url(#d-eye-l)">
              <g id="doll-lid-l">
                <rect x="178" y="124" width="38" height="24" fill="#F7E2D2" />
                <path
                  d="M 180 147 C 187 153, 207 154, 214 146"
                  stroke="#4A2E28"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </g>
            <g clipPath="url(#d-eye-r)">
              <g id="doll-lid-r">
                <rect x="224" y="124" width="38" height="24" fill="#F7E2D2" />
                <path
                  d="M 226 146 C 233 154, 253 153, 260 147"
                  stroke="#4A2E28"
                  strokeWidth="2.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>
            </g>

            <g id="doll-lashes">
              <path
                d="M 180 161 C 185 150, 207 148, 213 159"
                stroke="#4A2E28"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 181.5 160 L 176.5 155"
                stroke="#4A2E28"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <path
                d="M 260 161 C 255 150, 233 148, 227 159"
                stroke="#4A2E28"
                strokeWidth="3.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 258.5 160 L 263.5 155"
                stroke="#4A2E28"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
            </g>

            <path
              d="M 186 171 C 192 175, 204 175, 210 171"
              stroke="#C08F72"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.8"
              fill="none"
            />
            <path
              d="M 254 171 C 248 175, 236 175, 230 171"
              stroke="#C08F72"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.8"
              fill="none"
            />
            <path
              d="M 219 184 C 221 186, 221 188, 219.5 189"
              stroke="#DFA891"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 210 202 C 216 207, 224 207, 230 202"
              stroke="#B85C60"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 214 209 C 218 211, 222 211, 226 209"
              stroke="#DFA891"
              strokeWidth="1.2"
              strokeLinecap="round"
              opacity="0.7"
              fill="none"
            />
            <ellipse cx="192" cy="188" rx="11" ry="6" fill="url(#d-cheek)" />
            <ellipse cx="248" cy="188" rx="11" ry="6" fill="url(#d-cheek)" />
          </g>

          <g id="doll-bangs" style={{ transformOrigin: "220px 120px" }}>
            <path
              d="M 172 132 C 168 108, 180 88, 204 82 C 196 100, 192 120, 192 140 C 186 142, 178 140, 172 132 Z"
              fill="url(#d-hair)"
            />
            <path
              d="M 192 138 C 192 112, 200 92, 220 84 C 214 104, 212 126, 214 146 C 206 148, 198 145, 192 138 Z"
              fill="url(#d-hair)"
            />
            <path
              d="M 214 144 C 214 118, 224 96, 244 88 C 238 108, 236 128, 238 146 C 230 150, 221 149, 214 144 Z"
              fill="url(#d-hair)"
            />
            <path
              d="M 238 144 C 240 120, 250 102, 266 96 C 264 114, 264 130, 266 142 C 258 148, 247 149, 238 144 Z"
              fill="url(#d-hair)"
            />
            <path
              d="M 266 140 C 268 124, 270 112, 272 104 C 278 116, 280 130, 278 142 C 274 146, 269 145, 266 140 Z"
              fill="#D9A855"
            />
            <path
              d="M 172 132 C 170 118, 172 106, 176 98 C 172 112, 172 124, 174 136 Z"
              fill="#C99A4B"
            />
            <g fill="#F7E2D2">
              <path d="M 188 124 L 193 148 L 198 126 Z" />
              <path d="M 210 128 L 215 152 L 220 130 Z" />
              <path d="M 234 128 L 239 152 L 244 130 Z" />
              <path d="M 258 124 L 262 146 L 266 126 Z" />
            </g>
            <g
              stroke="#A87C36"
              strokeWidth="1.3"
              opacity="0.7"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M 193 106 C 190 118, 189 128, 190 138" />
              <path d="M 220 104 C 216 118, 216 132, 217 143" />
              <path d="M 245 106 C 242 118, 241 130, 242 142" />
            </g>
            <g
              stroke="#F9E2A8"
              strokeWidth="1.6"
              opacity="0.72"
              strokeLinecap="round"
              fill="none"
            >
              <path d="M 201 106 C 198 118, 197 128, 198 138" />
              <path d="M 228 104 C 225 118, 224 132, 225 142" />
            </g>
          </g>

          <g id="doll-crown" style={{ transformOrigin: "220px 100px" }}>
            <path
              d="M 162 128 C 152 96, 172 66, 206 58 C 246 49, 282 68, 286 104 C 288 118, 284 130, 278 138 C 282 116, 272 92, 246 82 C 214 70, 180 84, 170 112 C 167 120, 164 125, 162 128 Z"
              fill="url(#d-hair)"
            />
            <g transform="translate(-8,15)">
              <ellipse
                cx="258"
                cy="66"
                rx="15.5"
                ry="10.5"
                fill="#D9A855"
                transform="rotate(14 258 66)"
              />
              <path
                d="M 246 60 C 252 56, 262 55, 270 60 M 244 68 C 252 63, 264 62, 272 68 M 248 74 C 255 70, 265 70, 270 73"
                stroke="#A87C36"
                strokeWidth="1.4"
                fill="none"
                opacity="0.8"
              />
            </g>
            <g fill="url(#d-hair)" stroke="#A87C36" strokeWidth="1.2">
              <ellipse cx="168" cy="116" rx="11" ry="8" transform="rotate(-58 168 116)" />
              <ellipse cx="178" cy="98" rx="12" ry="9" transform="rotate(-44 178 98)" />
              <ellipse cx="194" cy="83" rx="12.5" ry="9" transform="rotate(-28 194 83)" />
              <ellipse cx="214" cy="74" rx="13" ry="9.5" transform="rotate(-12 214 74)" />
              <ellipse cx="236" cy="73" rx="13" ry="9.5" transform="rotate(6 236 73)" />
              <ellipse cx="256" cy="80" rx="12.5" ry="9" transform="rotate(24 256 80)" />
              <ellipse cx="272" cy="94" rx="12" ry="8.5" transform="rotate(42 272 94)" />
              <ellipse cx="282" cy="112" rx="10.5" ry="8" transform="rotate(58 282 112)" />
            </g>
            <g
              stroke="#C99A4B"
              strokeWidth="1.6"
              fill="none"
              opacity="0.85"
              strokeLinecap="round"
            >
              <path d="M 162 120 C 164 114, 168 110, 173 108" />
              <path d="M 172 101 C 175 95, 180 91, 186 90" />
              <path d="M 189 86 C 193 81, 199 78, 205 78" />
              <path d="M 209 76 C 214 72, 221 71, 227 72" />
              <path d="M 231 72 C 237 70, 243 71, 248 74" />
              <path d="M 252 79 C 258 78, 264 81, 267 85" />
              <path d="M 268 92 C 274 93, 278 97, 280 102" />
            </g>
            <circle cx="278" cy="122" r="2.4" fill="#F0CD8A" />
            <circle cx="284" cy="110" r="2" fill="#F0CD8A" />

            {/* the rose, in sealing-wax red */}
            <g id="doll-rose">
              <path
                d="M 152 106 C 144 110, 140 118, 144 124 C 136 124, 132 130, 136 136 C 142 141, 150 139, 154 134 Z"
                fill="#41562F"
              />
              <path
                d="M 176 122 C 184 126, 190 132, 188 138 C 194 136, 199 138, 200 142 C 196 148, 188 148, 182 144 Z"
                fill="#41562F"
              />
              <circle cx="164" cy="120" r="19" fill="#6F2831" />
              <path
                d="M 149 112 C 154 102, 168 99, 177 106 C 184 112, 184 124, 177 131 C 183 126, 185 116, 180 109 C 189 114, 191 126, 184 134 C 177 141, 164 141, 157 134 C 150 127, 149 118, 152 112 Z"
                fill="#9B3A44"
              />
              <path
                d="M 157 115 C 161 108, 170 107, 175 112 C 179 117, 178 125, 172 129 C 176 124, 176 117, 171 113 C 175 118, 174 125, 169 128 C 163 131, 157 128, 155 122 Z"
                fill="#BE5560"
              />
              <circle cx="165" cy="120" r="5" fill="#D98A8F" />
              <path
                d="M 163 118 C 165 116, 168 117, 168 120 C 168 122, 165 123, 163 122"
                stroke="#6F2831"
                strokeWidth="1.2"
                fill="none"
              />
            </g>
          </g>

          <path
            d="M 174 130 C 168 156, 168 184, 176 206 C 179 208, 182 208, 184 206 C 177 184, 177 158, 181 134 Z"
            fill="url(#d-hair)"
          />
          <path
            d="M 266 130 C 272 156, 272 184, 264 206 C 261 208, 258 208, 256 206 C 263 184, 263 158, 259 134 Z"
            fill="url(#d-hair)"
          />
          <path
            d="M 262 124 C 265 152, 261 182, 250 202 C 252 203, 254 203, 255 202 C 266 182, 269 150, 266 122 Z"
            fill="#E8B15C"
            opacity="0.45"
          />
        </g>
      </g>
    </svg>
  );
}

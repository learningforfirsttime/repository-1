"use client";

import { useInView } from "@/lib/useInView";
import type { CSSProperties } from "react";

const stroke = (delay: number, dur = 1.6) =>
  ({
    "--path-len": 100,
    "--draw-dur": `${dur}s`,
    "--draw-delay": `${delay}s`,
  }) as CSSProperties;

/**
 * The doll's writing desk at night — an arched window, a crescent moon,
 * an inkwell with the pen still in it, and a letter waiting to be sent.
 * Hand-plotted SVG line art that draws itself as you arrive.
 */
export default function DeskStillLife() {
  const { ref, inView } = useInView<HTMLDivElement>(0.35);

  return (
    <div ref={ref} className={inView ? "is-in" : ""}>
      <svg
        viewBox="0 0 400 480"
        role="img"
        aria-label="Line drawing of a writing desk by an arched window at night: an inkwell with a pen resting in it, a sealed letter, and a crescent moon."
        className="h-auto w-full max-w-md text-gold"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c9a15c" stopOpacity="0.16" />
            <stop offset="60%" stopColor="#c9a15c" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#c9a15c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* lamplight, arriving late */}
        <circle
          cx="126"
          cy="296"
          r="110"
          fill="url(#lampGlow)"
          className="fade-in-late"
          style={{ "--fade-delay": "2.1s" } as CSSProperties}
        />

        {/* the arched window */}
        <path
          d="M 46 448 L 46 196 A 154 154 0 0 1 354 196 L 354 448"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.8"
          pathLength={100}
          className="draw-path"
          style={stroke(0, 2.4)}
        />
        <path
          d="M 28 448 L 372 448"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.5"
          pathLength={100}
          className="draw-path"
          style={stroke(0.5, 1.2)}
        />

        {/* crescent moon */}
        <path
          d="M 268 96 A 26 26 0 1 0 268 148 A 21 21 0 1 1 268 96 Z"
          stroke="currentColor"
          strokeWidth="1.3"
          pathLength={100}
          className="draw-path"
          style={stroke(0.9, 1.4)}
        />

        {/* stars */}
        <g
          className="fade-in-late"
          style={{ "--fade-delay": "1.5s" } as CSSProperties}
          fill="currentColor"
        >
          <path d="M 132 112 l 0 -6 m 0 12 l 0 -6 m -6 0 l 6 0 m 6 0 l -6 0" stroke="currentColor" strokeWidth="1.1" fill="none" />
          <circle cx="182" cy="86" r="1.3" opacity="0.8" />
          <circle cx="98" cy="164" r="1.1" opacity="0.6" />
          <circle cx="318" cy="176" r="1.3" opacity="0.7" />
          <circle cx="222" cy="142" r="1" opacity="0.5" />
          <path d="M 306 108 l 0 -5 m 0 10 l 0 -5 m -5 0 l 5 0 m 5 0 l -5 0" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.7" />
        </g>

        {/* the desk */}
        <path
          d="M 62 368 L 338 368"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.9"
          pathLength={100}
          className="draw-path"
          style={stroke(0.7, 1.4)}
        />

        {/* inkwell */}
        <path
          d="M 106 368 L 106 340 Q 106 333 113 333 L 116 333 L 116 324 L 134 324 L 134 333 L 137 333 Q 144 333 144 340 L 144 368"
          stroke="currentColor"
          strokeWidth="1.4"
          pathLength={100}
          className="draw-path"
          style={stroke(1.1, 1.4)}
        />
        <ellipse
          cx="125"
          cy="324"
          rx="9"
          ry="2.6"
          stroke="currentColor"
          strokeWidth="1.1"
          pathLength={100}
          className="draw-path"
          style={stroke(1.5, 0.8)}
        />

        {/* a quill, resting in the well */}
        <path
          d="M 128 320 C 158 292, 182 268, 204 244 C 212 235, 220 238, 214 248 C 196 272, 168 298, 138 322"
          stroke="currentColor"
          strokeWidth="1.3"
          pathLength={100}
          className="draw-path"
          style={stroke(1.6, 1.4)}
        />
        <path
          d="M 130 318 C 160 292, 184 268, 208 243"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.7"
          pathLength={100}
          className="draw-path"
          style={stroke(1.9, 1.2)}
        />
        <path
          d="M 168 288 C 173 288, 178 285, 181 281 M 184 272 C 189 272, 194 269, 197 265 M 152 304 C 157 304, 161 301, 164 297"
          stroke="currentColor"
          strokeWidth="0.9"
          opacity="0.6"
          pathLength={100}
          className="draw-path"
          style={stroke(2.2, 1)}
        />

        {/* the letter, sealed */}
        <g transform="rotate(-5 262 332)">
          <path
            d="M 212 308 L 314 308 L 314 358 L 212 358 Z"
            stroke="currentColor"
            strokeWidth="1.4"
            pathLength={100}
            className="draw-path"
            style={stroke(1.3, 1.4)}
          />
          <path
            d="M 212 308 L 263 338 L 314 308"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.85"
            pathLength={100}
            className="draw-path"
            style={stroke(1.8, 1)}
          />
          <circle
            cx="263"
            cy="344"
            r="4.5"
            fill="#8e3b46"
            className="fade-in-late"
            style={{ "--fade-delay": "2.6s" } as CSSProperties}
          />
        </g>

        {/* a closing flourish */}
        <path
          d="M 118 414 C 152 400, 186 428, 200 414 C 214 400, 248 428, 282 414"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.55"
          pathLength={100}
          className="draw-path"
          style={stroke(2.2, 1.6)}
        />
        <circle
          cx="200"
          cy="414"
          r="1.6"
          fill="currentColor"
          className="fade-in-late"
          style={{ "--fade-delay": "3s" } as CSSProperties}
        />
      </svg>
    </div>
  );
}

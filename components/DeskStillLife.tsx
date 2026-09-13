"use client";

import type { CSSProperties } from "react";
import { useInView } from "@/lib/useInView";

const stroke = (delay: number, dur = 1.6): CSSProperties =>
  ({
    "--path-len": 100,
    "--draw-dur": `${dur}s`,
    "--draw-delay": `${delay}s`,
  }) as CSSProperties;

/**
 * Her desk, drawn in one continuous session: an arched window, a crescent
 * moon, the inkwell with the pen still in it, and a letter already sealed.
 * Every stroke inks itself in order when the section arrives.
 */
export default function DeskStillLife() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <div ref={ref} className={inView ? "is-in" : ""}>
      <svg
        viewBox="0 0 400 480"
        role="img"
        aria-label="Line drawing of a writing desk by an arched window at night: an inkwell with a pen resting in it, a sealed letter, and a crescent moon."
        className="h-auto w-full max-w-md text-brass"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <radialGradient id="desk-lamp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8B15C" stopOpacity="0.2" />
            <stop offset="58%" stopColor="#E8B15C" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#E8B15C" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="desk-moon" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C86D8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7C86D8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="268"
          cy="122"
          r="92"
          fill="url(#desk-moon)"
          className="fade-in-late"
          style={{ "--fade-delay": "1.8s" } as CSSProperties}
        />
        <circle
          cx="126"
          cy="296"
          r="112"
          fill="url(#desk-lamp)"
          className="fade-in-late"
          style={{ "--fade-delay": "2.1s" } as CSSProperties}
        />

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

        <path
          d="M 268 96 A 26 26 0 1 0 268 148 A 21 21 0 1 1 268 96 Z"
          stroke="#9FB0EE"
          strokeWidth="1.3"
          pathLength={100}
          className="draw-path"
          style={stroke(0.9, 1.4)}
        />

        <g
          className="fade-in-late"
          style={{ "--fade-delay": "1.5s" } as CSSProperties}
          fill="currentColor"
        >
          <path
            d="M 132 112 l 0 -6 m 0 12 l 0 -6 m -6 0 l 6 0 m 6 0 l -6 0"
            stroke="currentColor"
            strokeWidth="1.1"
            fill="none"
          />
          <circle cx="182" cy="86" r="1.3" opacity="0.8" />
          <circle cx="98" cy="164" r="1.1" opacity="0.6" />
          <circle cx="318" cy="176" r="1.3" opacity="0.7" />
          <circle cx="222" cy="142" r="1" opacity="0.5" />
        </g>

        <path
          d="M 62 368 L 338 368"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.9"
          pathLength={100}
          className="draw-path"
          style={stroke(0.7, 1.4)}
        />

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

        <path
          d="M 128 320 C 158 292, 182 268, 204 244 C 212 235, 220 238, 214 248 C 196 272, 168 298, 138 322"
          stroke="currentColor"
          strokeWidth="1.3"
          pathLength={100}
          className="draw-path"
          style={stroke(1.6, 1.4)}
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
            r="5"
            fill="#9B3A44"
            className="fade-in-late"
            style={{ "--fade-delay": "2.6s" } as CSSProperties}
          />
        </g>

        <path
          d="M 118 414 C 152 400, 186 428, 200 414 C 214 400, 248 428, 282 414"
          stroke="currentColor"
          strokeWidth="1.1"
          opacity="0.5"
          pathLength={100}
          className="draw-path"
          style={stroke(2.2, 1.6)}
        />
      </svg>
    </div>
  );
}

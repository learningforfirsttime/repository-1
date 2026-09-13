"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useInView } from "@/lib/useInView";

/**
 * How it works — a true sequence, so the numbers are earned.
 *
 * A single hand-plotted line inks itself through the three steps as the
 * section arrives: horizontal on desktop, vertical on narrow screens. The
 * markers fade in behind the line as it reaches them, so the order reads as
 * a route rather than a list.
 */

const STEPS = [
  {
    n: "01",
    title: "Choose your letter",
    body: "Gratitude, reconciliation, farewell — or the one you cannot say out loud. The kind you pick decides what she will ask.",
  },
  {
    n: "02",
    title: "Converse with the doll",
    body: "Fifteen or twenty unhurried minutes. She asks; you answer in whatever order it comes out. Contradicting yourself is allowed, and useful.",
  },
  {
    n: "03",
    title: "Receive your letter",
    body: "She writes it in your voice, and hands it back for you to change. Whether it is ever sent is entirely your own business.",
  },
];

const draw = (delay: number, dur = 1.6): CSSProperties =>
  ({
    "--path-len": 100,
    "--draw-dur": `${dur}s`,
    "--draw-delay": `${delay}s`,
  }) as CSSProperties;

export default function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);

  return (
    <section
      id="how"
      className="section-pad relative scroll-mt-24"
      aria-labelledby="how-heading"
    >
      <div
        ref={ref}
        className={`mx-auto max-w-content px-5 md:px-10 ${inView ? "is-in" : ""}`}
      >
        <div className="max-w-2xl">
          <p className="kicker fade-in-late" style={{ "--fade-delay": "0s" } as CSSProperties}>
            How it works
          </p>
          <h2
            id="how-heading"
            className="display-lg fade-in-late mt-5 text-balance text-moonpaper"
            style={{ "--fade-delay": "0.1s" } as CSSProperties}
          >
            Three steps, and none of them is a form.
          </h2>
        </div>

        {/* the line, inking itself — desktop */}
        <div className="relative mt-16 hidden lg:block">
          <svg
            aria-hidden="true"
            viewBox="0 0 1000 90"
            preserveAspectRatio="none"
            className="h-[90px] w-full text-brass"
            fill="none"
          >
            <path
              d="M 9 62 C 120 24, 250 82, 352 50 C 470 14, 600 78, 695 48 C 800 20, 910 56, 985 42"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              pathLength={100}
              className="draw-path"
              style={draw(0.2, 2.2)}
              opacity="0.85"
            />
            {[
              { cx: 9, cy: 62, d: 0.45 },
              { cx: 352, cy: 50, d: 0.95 },
              { cx: 695, cy: 48, d: 1.45 },
            ].map((p) => (
              <g
                key={p.cx}
                className="fade-in-late"
                style={{ "--fade-delay": `${p.d}s` } as CSSProperties}
              >
                <circle cx={p.cx} cy={p.cy} r="9" fill="#0E1526" />
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r="5"
                  fill="#E8B15C"
                  stroke="#0E1526"
                  strokeWidth="1.4"
                />
              </g>
            ))}
          </svg>
        </div>

        <ol className="mt-6 grid gap-10 lg:mt-2 lg:grid-cols-3 lg:gap-8">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="fade-in-late relative pl-10 lg:pl-0"
              style={{ "--fade-delay": `${0.35 + i * 0.45}s` } as CSSProperties}
            >
              {/* the vertical thread, for narrow screens */}
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-2 h-full w-px bg-gradient-to-b from-brass/60 to-transparent lg:hidden"
              />
              <span
                aria-hidden="true"
                className="absolute left-0 top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-candlelight ring-4 ring-midnight lg:hidden"
              />

              <p className="font-mono text-[0.6875rem] tracking-[0.28em] text-candlelight">
                {s.n}
              </p>
              <h3 className="display-md mt-3 text-moonpaper">{s.title}</h3>
              <p className="mt-3 max-w-sm text-[0.975rem] leading-relaxed text-ash">
                {s.body}
              </p>
            </li>
          ))}
        </ol>

        <div
          className="fade-in-late mt-14"
          style={{ "--fade-delay": "1.9s" } as CSSProperties}
        >
          <Link href="/services" className="btn-quiet">
            See the letters she writes
          </Link>
        </div>
      </div>
    </section>
  );
}

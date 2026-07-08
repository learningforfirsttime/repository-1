"use client";

import { useInView } from "@/lib/useInView";
import Reveal from "./Reveal";
import type { CSSProperties } from "react";

const stroke = (delay: number, dur = 1.2) =>
  ({
    "--path-len": 100,
    "--draw-dur": `${dur}s`,
    "--draw-delay": `${delay}s`,
  }) as CSSProperties;

function IconHearth({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 text-gold" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M 10 26 L 28 10 L 46 26" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay)} />
      <path d="M 14 24 L 14 46 L 42 46 L 42 24" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay + 0.3)} />
      <path d="M 24 46 L 24 34 L 32 34 L 32 46" stroke="currentColor" strokeWidth="1.4" pathLength={100} className="draw-path" style={stroke(delay + 0.6)} />
    </svg>
  );
}

function IconKey({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 text-gold" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay)} />
      <circle cx="20" cy="20" r="3" stroke="currentColor" strokeWidth="1.2" pathLength={100} className="draw-path" style={stroke(delay + 0.3)} />
      <path d="M 27 27 L 44 44 M 38 38 L 43 33 M 42 42 L 47 37" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay + 0.5)} />
    </svg>
  );
}

function IconCrescent({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-11 w-11 text-gold" fill="none" strokeLinecap="round" aria-hidden="true">
      <path
        d="M 34 8 A 22 22 0 1 0 34 48 A 17.5 17.5 0 1 1 34 8 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        pathLength={100}
        className="draw-path"
        style={stroke(delay, 1.6)}
      />
      <circle cx="41" cy="17" r="1" fill="currentColor" className="fade-in-late" style={{ "--fade-delay": `${delay + 1.4}s` } as CSSProperties} />
      <circle cx="46" cy="27" r="1.3" fill="currentColor" className="fade-in-late" style={{ "--fade-delay": `${delay + 1.7}s` } as CSSProperties} />
    </svg>
  );
}

const VOWS = [
  {
    Icon: IconHearth,
    title: "It stays home",
    body: "The conversation and the letter live on your device, and nowhere else. No cloud, no account, no copy kept.",
  },
  {
    Icon: IconKey,
    title: "Yours alone",
    body: "The doll signs nothing, keeps nothing, and remembers only what you ask her to remember. The key is yours.",
  },
  {
    Icon: IconCrescent,
    title: "Quiet by design",
    body: "No subscriptions, no notifications, no urgency of any kind. She waits, patiently, until she is called.",
  },
];

export default function Promise() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);

  return (
    <section id="promise" className="section-pad relative" aria-labelledby="promise-heading">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <div className="relative overflow-hidden rounded-[3px] border border-gold/15 bg-gradient-to-b from-ink/70 to-night-2/90 px-8 py-16 md:px-16 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
          />
          <Reveal className="text-center">
            <p className="kicker">The doll&rsquo;s promise</p>
            <h2
              id="promise-heading"
              className="text-balance mx-auto mt-5 max-w-2xl font-display text-4xl font-light text-cream md:text-5xl"
            >
              Your words never leave your machine.
            </h2>
            <p className="prose-quiet mx-auto mt-6 max-w-xl">
              What you tell a doll in confidence stays in confidence. Everything
              runs locally — the listening, the asking, the writing.
            </p>
          </Reveal>

          <div ref={ref} className={`mt-16 grid gap-12 md:grid-cols-3 md:gap-8 ${inView ? "is-in" : ""}`}>
            {VOWS.map((v, i) => (
              <Reveal key={v.title} delay={0.15 + i * 0.2} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center">
                  <v.Icon delay={0.3 + i * 0.4} />
                </div>
                <h3 className="mt-6 font-display text-xl font-normal text-cream">{v.title}</h3>
                <p className="prose-quiet mx-auto mt-3 max-w-xs text-[0.95rem]">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

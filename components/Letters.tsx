"use client";

import Reveal from "./Reveal";
import type { MouseEvent } from "react";

const LETTERS = [
  {
    numeral: "I",
    name: "Letter of Gratitude",
    line: "For someone you never properly thanked.",
    session: "≈ 15-minute conversation",
  },
  {
    numeral: "II",
    name: "Letter of Reconciliation",
    line: "For the relationship you want to mend.",
    session: "≈ 20-minute conversation",
  },
  {
    numeral: "III",
    name: "Letter to the Future",
    line: "To your future self — or to a child, sealed for years.",
    session: "≈ 15-minute conversation",
  },
  {
    numeral: "IV",
    name: "Farewell Letter",
    line: "To say goodbye the way it deserved.",
    session: "≈ 20-minute conversation",
  },
  {
    numeral: "V",
    name: "Confession",
    line: "For the feeling you cannot say out loud.",
    session: "≈ 15-minute conversation",
  },
];

function trackGlow(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
}

function SessionMark() {
  return (
    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 text-gold/80" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="5.6" stroke="currentColor" strokeWidth="1" />
      <path d="M 7 4.2 L 7 7 L 9.3 8.6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MiniSeal() {
  return (
    <svg viewBox="0 0 24 24" className="card-seal h-6 w-6" aria-hidden="true">
      <path
        d="M12 1.8 C15.4 1.6 20 4.2 21.6 8 C23.2 11.8 21.8 16.6 18.8 19.2 C15.8 21.8 10.6 23 7.2 21 C3.8 19 1.4 15.2 2 11.2 C2.6 7.2 5.4 3.4 9 2.2 C10 1.9 11 1.85 12 1.8 Z"
        fill="#8e3b46"
      />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#5c1f2a" strokeWidth="0.9" />
      <circle cx="12" cy="12" r="6.5" fill="none" stroke="#c96b74" strokeWidth="0.5" strokeDasharray="3 38" transform="rotate(-50 12 12)" />
    </svg>
  );
}

export default function Letters() {
  return (
    <section id="letters" className="section-pad relative" aria-labelledby="letters-heading">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <Reveal>
          <p className="kicker">The letters she writes</p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <h2
              id="letters-heading"
              className="text-balance max-w-xl font-display text-4xl font-light text-cream md:text-5xl"
            >
              Five kinds of unsaid things.
            </h2>
            <p className="prose-quiet max-w-sm text-[0.95rem]">
              Every letter begins the same way: with a conversation, and a doll
              who is in no hurry at all.
            </p>
          </div>
          <div className="hairline-left mt-10" />
        </Reveal>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-6">
          {LETTERS.map((l, i) => (
            <Reveal
              as="li"
              key={l.numeral}
              delay={0.1 + i * 0.12}
              className={i < 3 ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <article
                className="letter-card flex h-full flex-col p-8"
                onMouseMove={trackGlow}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-3xl font-light italic text-gold" aria-hidden="true">
                    {l.numeral}
                  </span>
                  <MiniSeal />
                </div>
                <h3 className="mt-6 font-display text-[1.55rem] font-normal leading-snug text-cream">
                  {l.name}
                </h3>
                <p className="prose-quiet mt-3 flex-1 text-[0.98rem]">{l.line}</p>
                <div className="mt-8">
                  <span className="card-thread" aria-hidden="true" />
                  <p className="mt-4 flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-faded">
                    <SessionMark />
                    {l.session}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>

        <Reveal delay={0.2}>
          <p className="prose-quiet mt-12 text-center text-[0.95rem] italic">
            Nothing here is for sale. A doll writes because she is asked, not because she is paid.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

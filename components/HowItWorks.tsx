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

function IconSpeak({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-12 w-12 text-gold" fill="none" strokeLinecap="round" aria-hidden="true">
      <circle cx="20" cy="28" r="3" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay)} />
      <path d="M 28 18 A 14 14 0 0 1 28 38" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay + 0.25)} />
      <path d="M 34 12 A 22 22 0 0 1 34 44" stroke="currentColor" strokeWidth="1.5" opacity="0.7" pathLength={100} className="draw-path" style={stroke(delay + 0.5)} />
      <path d="M 40 6 A 30 30 0 0 1 40 50" stroke="currentColor" strokeWidth="1.5" opacity="0.4" pathLength={100} className="draw-path" style={stroke(delay + 0.75)} />
    </svg>
  );
}

function IconAsk({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-12 w-12 text-gold" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path
        d="M 10 14 Q 10 10 14 10 L 42 10 Q 46 10 46 14 L 46 32 Q 46 36 42 36 L 26 36 L 16 45 L 18 36 L 14 36 Q 10 36 10 32 Z"
        stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay)}
      />
      <path
        d="M 23 20 Q 23 15.5 28 15.5 Q 33 15.5 33 19.5 Q 33 23 28.5 24.5 L 28.5 27"
        stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay + 0.45)}
      />
      <circle cx="28.5" cy="31.5" r="0.9" fill="currentColor" className="fade-in-late" style={{ "--fade-delay": `${delay + 1.2}s` } as CSSProperties} />
    </svg>
  );
}

function IconReceive({ delay }: { delay: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-12 w-12 text-gold" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M 8 18 L 48 18 L 48 42 L 8 42 Z" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay)} />
      <path d="M 8 18 L 28 32 L 48 18" stroke="currentColor" strokeWidth="1.5" pathLength={100} className="draw-path" style={stroke(delay + 0.4)} />
      <path d="M 22 10 Q 28 5 34 10" stroke="currentColor" strokeWidth="1.3" opacity="0.6" pathLength={100} className="draw-path" style={stroke(delay + 0.8)} />
    </svg>
  );
}

const STEPS = [
  {
    Icon: IconSpeak,
    title: "You speak",
    body: "Ten or twenty minutes, plainly. There is no wrong way to begin — most people start with “I don’t know how to say this.”",
  },
  {
    Icon: IconAsk,
    title: "She asks",
    body: "Small, careful questions: the name they called you, the last ordinary day, what you would want read aloud. She listens for the sentence hiding under the others.",
  },
  {
    Icon: IconReceive,
    title: "You receive",
    body: "A letter in your voice, on your desk moments after the last question. Change a word, or send it as it stands — it was always yours.",
  },
];

export default function HowItWorks() {
  const { ref, inView } = useInView<HTMLDivElement>(0.25);

  return (
    <section className="section-pad relative" aria-labelledby="how-heading">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <Reveal>
          <p className="kicker text-center">How a letter comes to be</p>
          <h2
            id="how-heading"
            className="text-balance mt-5 text-center font-display text-4xl font-light text-cream md:text-5xl"
          >
            Three quiet steps.
          </h2>
        </Reveal>

        <div ref={ref} className={`relative mt-20 ${inView ? "is-in" : ""}`}>
          {/* the thread that connects the steps */}
          <div
            aria-hidden="true"
            className="absolute left-[16.66%] right-[16.66%] top-10 hidden h-px origin-left bg-gradient-to-r from-gold/50 via-gold/25 to-gold/50 transition-transform duration-[2400ms] ease-soft md:block"
            style={{ transform: inView ? "scaleX(1)" : "scaleX(0)" }}
          />
          <ol className="grid gap-14 md:grid-cols-3 md:gap-10">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.title} delay={0.2 + i * 0.25} className="relative text-center">
                <div className="relative z-10 mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-night">
                  <s.Icon delay={0.4 + i * 0.5} />
                </div>
                <p className="kicker mt-8 !tracking-[0.3em] text-faded">Step {["one", "two", "three"][i]}</p>
                <h3 className="mt-3 font-display text-2xl font-normal text-cream">{s.title}</h3>
                <p className="prose-quiet mx-auto mt-4 max-w-xs text-[0.98rem]">{s.body}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

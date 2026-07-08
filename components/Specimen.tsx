"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";
import Reveal from "./Reveal";

const LETTER = `Dear Nan,

I have started this letter eleven times. This time I had help.

You taught me to whistle on the walk home from the bus stop, the autumn I was seven. I never told you that I still do it — same street, same three notes, past your old gate.

I am not writing because something is wrong. I am writing because nothing is, and I noticed I never say so.

Thank you for the whistling. Thank you for everything I filed under “later.”

With love,
June`;

/** The wax seal — an irregular pressed blob with the doll's monogram. */
function WaxSeal({ stamped }: { stamped: boolean }) {
  return (
    <svg
      viewBox="0 0 116 116"
      className={`seal-stamp h-24 w-24 md:h-28 md:w-28 ${stamped ? "is-stamped" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="waxGrad" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stopColor="#a84a56" />
          <stop offset="55%" stopColor="#8e3b46" />
          <stop offset="100%" stopColor="#65242f" />
        </radialGradient>
        <filter id="waxShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#3a1017" floodOpacity="0.5" />
        </filter>
      </defs>
      <path
        d="M 60 10 C 76 8, 96 18, 103 35 C 110 52, 107 73, 95 85 C 83 97, 65 108, 48 102 C 31 96, 15 85, 11 66 C 7 47, 13 27, 29 17 C 39 11, 49 11.5, 60 10 Z"
        fill="url(#waxGrad)"
        filter="url(#waxShadow)"
      />
      <circle cx="58" cy="57" r="33" fill="none" stroke="#5c1f2a" strokeWidth="1.6" />
      <circle cx="58" cy="57" r="33" fill="none" stroke="#cf7a83" strokeWidth="0.8" strokeDasharray="14 194" transform="rotate(-64 58 57)" />
      <text
        x="58"
        y="59"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontStyle="italic"
        fontSize="40"
        fill="#5c1f2a"
      >
        L
      </text>
      <text
        x="57.2"
        y="58.2"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontStyle="italic"
        fontSize="40"
        fill="#c96b74"
        opacity="0.55"
      >
        L
      </text>
    </svg>
  );
}

/** The flourish drawn beneath the signature once the letter is finished. */
function SignatureFlourish({ on }: { on: boolean }) {
  return (
    <div className={on ? "is-in" : ""} aria-hidden="true">
      <svg viewBox="0 0 220 26" className="mt-1 h-5 w-44 text-sepia/70" fill="none">
        <path
          d="M 6 16 C 40 4, 78 24, 108 13 C 126 7, 128 20, 116 20 C 106 20, 118 8, 146 12 C 172 16, 196 10, 214 14"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          pathLength={100}
          className="draw-path"
          style={{ "--path-len": 100, "--draw-dur": "1.4s", "--draw-delay": "0.35s" } as CSSProperties}
        />
      </svg>
    </div>
  );
}

function useTypewriter(text: string, active: boolean, reduced: boolean) {
  const [count, setCount] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const done = count >= text.length;

  useEffect(() => {
    if (!active || done) return;
    if (reduced) {
      setCount(text.length);
      return;
    }
    const prev = count > 0 ? text[count - 1] : "";
    let d = 24 + Math.random() * 34;
    if (prev === "," || prev === ";") d += 140;
    if (prev === "." || prev === "!" || prev === "?" || prev === "”") d += 240;
    if (prev === "\n") d += 260;
    if (Math.random() < 0.02) d += 220; // a small hesitation, as people do
    timer.current = window.setTimeout(() => setCount((c) => c + 1), d);
    return () => window.clearTimeout(timer.current);
  }, [count, active, done, reduced, text]);

  const restart = () => setCount(0);
  const finish = () => setCount(text.length);
  return { typed: text.slice(0, count), done, restart, finish };
}

export default function Specimen() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const { typed, done, restart, finish } = useTypewriter(LETTER, inView, reduced);

  return (
    <section id="specimen" className="section-pad relative" aria-labelledby="specimen-heading">
      <div className="mx-auto max-w-content px-6 md:px-10">
        <Reveal className="text-center">
          <p className="kicker">A specimen, typed before you</p>
          <h2
            id="specimen-heading"
            className="text-balance mx-auto mt-5 max-w-2xl font-display text-4xl font-light text-cream md:text-5xl"
          >
            Fourteen minutes of conversation became this.
          </h2>
        </Reveal>

        <Reveal delay={0.15}>
          <div ref={ref} className="relative mx-auto mt-16 max-w-2xl">
            <figure className="parchment-sheet px-8 py-12 sm:px-14 sm:py-16">
              <div className="relative font-type text-[0.92rem] leading-[2.05] sm:text-[1rem]">
                {/* invisible full text reserves the sheet's final size */}
                <div className="invisible whitespace-pre-wrap" aria-hidden="true">
                  {LETTER}
                </div>
                <div className="absolute inset-0 whitespace-pre-wrap" aria-hidden="true">
                  {typed}
                  {!done && inView && <span className="type-caret" />}
                  {done && <SignatureFlourish on={done} />}
                </div>
                <p className="sr-only">{LETTER}</p>
              </div>
              <div className="pointer-events-none absolute -bottom-7 -right-4 rotate-6 sm:-right-7">
                <WaxSeal stamped={done} />
              </div>
              <figcaption className="sr-only">
                A specimen letter of gratitude, written with an Auto Memory Doll. The names are
                invented; the feeling is not.
              </figcaption>
            </figure>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.28em] text-faded">
                Specimen · Letter of Gratitude
              </p>
              <div className="flex gap-6" aria-hidden={!inView}>
                <button
                  type="button"
                  onClick={restart}
                  className="nav-link cursor-pointer bg-transparent"
                >
                  Type it again
                </button>
                {!done && (
                  <button
                    type="button"
                    onClick={finish}
                    className="nav-link cursor-pointer bg-transparent"
                  >
                    Reveal at once
                  </button>
                )}
              </div>
            </div>

            <Reveal delay={0.3}>
              <p className="prose-quiet mt-8 text-center text-[0.95rem] italic">
                The names are invented. The feeling is not.
              </p>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

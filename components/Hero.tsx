"use client";

import { useEffect, useState, type CSSProperties } from "react";
import InkVeil from "./InkVeil";
import Motes from "./Motes";

/** The headline settles onto the page one glyph at a time, like ink drying. */
function InkTitle({ text, startDelay = 0 }: { text: string; startDelay?: number }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);

  const words = text.split(" ");
  let i = 0;
  return (
    <span className={on ? "is-in" : ""} aria-label={text} role="text">
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap" aria-hidden="true">
          {Array.from(word).map((ch, ci) => {
            const delay = startDelay + i++ * 0.045;
            return (
              <span
                key={ci}
                className="glyph"
                style={{ "--glyph-delay": `${delay}s` } as CSSProperties}
              >
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}

function Rise({
  children,
  delay,
  className = "",
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), 60);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div
      className={`reveal ${on ? "is-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <InkVeil />
      <Motes />
      <div className="hero-fade pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex w-full max-w-content flex-1 flex-col items-center justify-center px-6 pb-24 pt-32 text-center md:px-10">
        <Rise delay={0.2}>
          <p className="kicker">An Auto Memory Doll · At Your Service</p>
        </Rise>

        <Rise delay={0.55} className="mt-8 max-w-2xl">
          <p className="font-display text-lg italic leading-relaxed text-faded md:text-xl">
            “Good evening — I am <span className="text-gold-bright">Liselle</span>,
            your Auto&nbsp;Memory&nbsp;Doll. If something has waited too long to be
            said, you may leave it with me.”
          </p>
        </Rise>

        <h1 className="text-balance mt-10 max-w-4xl font-display text-5xl font-light leading-[1.08] text-cream md:text-7xl">
          <InkTitle text="For the words you never" startDelay={1.1} />
          <br />
          <em className="font-normal italic text-gold-bright">
            <InkTitle text="managed to say." startDelay={2.2} />
          </em>
        </h1>

        <Rise delay={2.9} className="mt-10 max-w-xl">
          <p className="prose-quiet text-balance">
            A brief, gentle conversation. She listens for what you truly mean —
            then writes it in your voice, only steadier. Everything stays on your
            machine; your words never leave it.
          </p>
        </Rise>

        <Rise delay={3.3} className="mt-12 flex flex-wrap items-center justify-center gap-5">
          <a href="#begin" className="btn btn-gold">
            Begin a session
          </a>
          <a href="#specimen" className="btn btn-ghost">
            Read a specimen
          </a>
        </Rise>
      </div>

      <div className="relative z-10 flex justify-center pb-10">
        <a
          href="#doll"
          aria-label="Scroll to learn what an Auto Memory Doll does"
          className="flex flex-col items-center gap-3 opacity-80 transition-opacity duration-500 hover:opacity-100"
        >
          <span className="kicker !tracking-[0.5em]">Listen</span>
          <span className="scroll-cue" />
        </a>
      </div>
    </section>
  );
}

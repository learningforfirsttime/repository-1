"use client";

import { useState } from "react";
import Reveal from "./Reveal";
import Emblem from "./Emblem";
import { useInView } from "@/lib/useInView";

export default function Begin() {
  const [note, setNote] = useState<string | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>(0.4);

  return (
    <section id="begin" className="section-pad relative" aria-labelledby="begin-heading">
      <div className="mx-auto max-w-content px-6 text-center md:px-10">
        <Reveal>
          <div ref={ref} className={`mx-auto flex justify-center text-gold ${inView ? "is-in" : ""}`}>
            <Emblem size={56} draw />
          </div>
          <h2
            id="begin-heading"
            className="text-balance mx-auto mt-10 max-w-3xl font-display text-5xl font-light leading-[1.1] text-cream md:text-6xl"
          >
            Whenever you are <em className="font-normal italic text-gold-bright">ready</em>.
          </h2>
          <p className="prose-quiet mx-auto mt-8 max-w-xl">
            The writing parlour is being prepared — the ribbon inked, the chairs
            set just so. Leave the kettle on; it will not be long.
          </p>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-5">
            <button
              type="button"
              className="btn btn-gold"
              onClick={() =>
                setNote(
                  "The parlour opens soon. Thank you for your patience — the letter will keep."
                )
              }
            >
              Begin a session · Opening soon
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() =>
                setNote("A letterbox is being fitted for enquiries. Do call again shortly.")
              }
            >
              Write to us · Coming soon
            </button>
          </div>
          <div aria-live="polite" className="mt-8 min-h-[2rem]">
            {note && (
              <p key={note} className="gentle-note font-display text-base italic text-faded">
                “{note}”
                <span className="ml-2 text-gold" aria-hidden="true">
                  — Liselle
                </span>
              </p>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

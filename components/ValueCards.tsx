"use client";

import Reveal from "./Reveal";

/**
 * Three folded sheets. The crease is real: the upper panel is a separate
 * plane that lifts a few degrees on hover, the way paper does when a hand
 * starts to open it. Restrained on purpose — the boldness on this page is
 * spent on the hero.
 */

const VALUES = [
  {
    n: "I",
    title: "She listens before she writes",
    body: "No template, no form, no blank page staring back. A short conversation in which she asks about the person, the moment, and the thing you almost said — and notices what you circle back to.",
  },
  {
    n: "II",
    title: "Your words, not ours",
    body: "She does not improve your feelings or reach for a better metaphor. She writes with your phrasing and your plain vocabulary, in the register you actually use with this person.",
  },
  {
    n: "III",
    title: "Private by design",
    body: "The doll runs on your own machine. Nothing you say is uploaded, and nothing is kept once you close the session. The letter, when it exists, exists only where you put it.",
  },
];

export default function ValueCards() {
  return (
    <section className="section-pad relative" aria-labelledby="values-heading">
      <div className="mx-auto max-w-content px-5 md:px-10">
        <Reveal>
          <p className="kicker">Why she is built this way</p>
          <h2
            id="values-heading"
            className="display-lg mt-5 max-w-[20ch] text-balance text-moonpaper"
          >
            Three promises, kept quietly.
          </h2>
        </Reveal>

        <ul className="stage-3d mt-14 grid gap-6 md:grid-cols-3 md:gap-7">
          {VALUES.map((v, i) => (
            <Reveal as="li" key={v.n} delay={i * 0.1} className="group h-full">
              <div className="page-surface flex h-full flex-col rounded-[3px] transition-transform duration-480 ease-ink group-hover:-translate-y-1.5">
                {/* the folded panel */}
                <div
                  className="relative origin-bottom border-b border-brass/25 px-7 pb-5 pt-7 transition-transform duration-480 ease-ink group-hover:[transform:rotateX(-9deg)]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom, rgba(232,177,92,0.09), rgba(232,177,92,0))",
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="font-display text-sm italic text-candlelight"
                    style={{ fontVariationSettings: '"opsz" 48' }}
                  >
                    {v.n}
                  </span>
                  <h3 className="display-md mt-2 text-moonpaper">{v.title}</h3>
                </div>

                <p className="px-7 pb-8 pt-6 text-[0.975rem] leading-relaxed text-ash">
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

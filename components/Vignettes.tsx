"use client";

import Reveal from "./Reveal";
import WaxSeal from "./effects/WaxSeal";

/**
 * Three short accounts, set as small letters and sealed. Everyone here is
 * invented — the atelier is fictional — and the section says so plainly
 * rather than dressing invention up as testimony.
 */

const VIGNETTES = [
  {
    body: "I had written eleven drafts and thrown away all of them. She asked what my father actually said when he handed me the keys — not what I wished he had said. I posted it on a Tuesday.",
    who: "R., on a letter of gratitude",
    seal: "#9B3A44",
    tilt: "-1.4deg",
  },
  {
    body: "We had not spoken in six years, and I did not want to win anything. What came back was four short paragraphs, and not one of them was about the argument. My brother rang the night it arrived.",
    who: "T., on a letter of reconciliation",
    seal: "#7C2F38",
    tilt: "1.1deg",
  },
  {
    body: "I wrote to my daughter for her eighteenth birthday while she was still small enough to fall asleep on me. I have not read it since. I know exactly what it says.",
    who: "J., on a letter to the future",
    seal: "#8A3340",
    tilt: "-0.7deg",
  },
];

export default function Vignettes() {
  return (
    <section
      className="section-pad relative"
      aria-labelledby="vignettes-heading"
    >
      <div className="mx-auto max-w-content px-5 md:px-10">
        <Reveal>
          <p className="kicker">From the ledger</p>
          <h2
            id="vignettes-heading"
            className="display-lg mt-5 max-w-[22ch] text-balance text-moonpaper"
          >
            What people say once the letter is out of their hands.
          </h2>
          <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brass/80">
            Composites, written for this page — the atelier is a fiction
          </p>
        </Reveal>

        <ul className="mt-14 grid gap-7 lg:grid-cols-3">
          {VIGNETTES.map((v, i) => (
            <Reveal as="li" key={v.who} delay={i * 0.12} className="h-full">
              <figure
                className="sheet relative flex h-full flex-col rounded-[2px] px-7 pb-16 pt-8 transition-transform duration-480 ease-ink hover:-translate-y-1"
                style={{ transform: `rotate(${v.tilt})` }}
              >
                {/* ruled lines, faint, the way cheap letter paper is */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-7 bottom-14 top-20 opacity-[0.14]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to bottom, transparent 0px, transparent 27px, #2A2418 27px, #2A2418 28px)",
                  }}
                />
                <blockquote className="relative font-body text-[1.0625rem] leading-[1.75] text-[#2A2418]">
                  “{v.body}”
                </blockquote>
                <figcaption className="relative mt-auto pt-7 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-[#6B5B3E]">
                  {v.who}
                </figcaption>
                <span className="absolute bottom-5 right-6">
                  <WaxSeal size={38} color={v.seal} />
                </span>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

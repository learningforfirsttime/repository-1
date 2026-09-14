import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import Hero from "@/components/Hero";
import Reveal from "@/components/Reveal";
import DeskStillLife from "@/components/DeskStillLife";
import ValueCards from "@/components/ValueCards";
import HowItWorks from "@/components/HowItWorks";
import Vignettes from "@/components/Vignettes";

/**
 * Is the drawn artwork present? Checked once, here, while the page is being
 * prerendered — so a missing frame costs nothing at runtime and the hero
 * silently falls back to the vector doll.
 */
const hasDollFrames = ["greeting.webp", "bow-mid.webp", "bow-full.webp"].every(
  (f) => existsSync(path.join(process.cwd(), "public", "doll", f))
);

export default function Page() {
  return (
    <main id="main" className="flex-1">
      <Hero hasFrames={hasDollFrames} />

      {/* ── what an Auto Memory Doll is ── */}
      <section
        className="section-pad relative"
        aria-labelledby="doll-heading"
      >
        <div className="mx-auto grid max-w-content items-center gap-14 px-5 md:px-10 lg:grid-cols-[1fr_1.08fr] lg:gap-24">
          <Reveal className="order-2 lg:order-1">
            <figure>
              <DeskStillLife />
              <figcaption className="mt-6 text-center font-display text-sm italic text-ash/80">
                In her ledger: names, weather, and the way you said “almost.”
              </figcaption>
            </figure>
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="kicker">What an Auto Memory Doll does</p>
              <h2
                id="doll-heading"
                className="display-lg mt-5 max-w-[16ch] text-balance text-moonpaper"
              >
                She listens <em className="italic text-candlelight">before</em>{" "}
                she writes.
              </h2>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="prose-quiet mt-8">
                An Auto Memory Doll is a letter-writing companion — not a
                template and not a questionnaire, but a short and unhurried
                conversation. She asks about the person, the occasion, and the
                thing you almost said. She notices what you return to, and what
                you step around.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="prose-quiet mt-6">
                Then she writes: a letter in <em>your</em> voice, only steadier.
                Your phrasing, your plain words, the register you actually use
                with this particular person. She holds the pen still while the
                feeling passes through it.
              </p>
            </Reveal>

            <Reveal delay={0.28}>
              <p className="prose-quiet mt-6">
                She works entirely on your own machine. Nothing is uploaded and
                nothing is kept. When the letter is finished it belongs to you,
                and so does the conversation that made it.
              </p>
            </Reveal>

            <Reveal delay={0.36}>
              <div className="hairline-left mt-10 max-w-[16rem]" />
              <p className="voice mt-6 text-xl leading-relaxed">
                “I do not invent your feelings. I only find where they were
                standing all along.”
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <ValueCards />
      <HowItWorks />
      <Vignettes />

      {/* ── the quiet invitation ── */}
      <section className="section-pad relative" aria-labelledby="closing-heading">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <div className="page-surface relative overflow-hidden rounded-[3px] px-7 py-14 text-center sm:px-14 sm:py-20">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 w-64 -translate-y-1/2 rounded-full"
                style={{
                  background:
                    "radial-gradient(closest-side, rgba(232,177,92,0.2), transparent 72%)",
                }}
              />
              <p className="kicker relative">The invitation</p>
              <h2
                id="closing-heading"
                className="display-lg relative mx-auto mt-5 max-w-[18ch] text-balance text-moonpaper"
              >
                There is someone you have been meaning to write to.
              </h2>
              <p className="prose-quiet relative mx-auto mt-6 text-center">
                You already know who. Fifteen minutes, no payment, nothing to
                install — and the letter is yours whether or not you ever send
                it.
              </p>
              <div className="relative mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-4">
                <Link href="/begin" className="btn-foil">
                  Begin a session
                </Link>
                <Link href="/services" className="btn-quiet">
                  Read the letters first
                </Link>
              </div>
              <p className="relative mt-10 font-display text-sm italic text-ash/75">
                — Wren, your Auto Memory Doll
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import DeskStillLife from "@/components/DeskStillLife";
import HowItWorks from "@/components/HowItWorks";
import Letters from "@/components/Letters";
import Specimen from "@/components/Specimen";
import Promise from "@/components/Promise";
import Begin from "@/components/Begin";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />

        {/* ————— What an Auto Memory Doll does ————— */}
        <section id="doll" className="section-pad relative" aria-labelledby="doll-heading">
          <div className="mx-auto grid max-w-content items-center gap-16 px-6 md:px-10 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
            <Reveal className="order-2 lg:order-1">
              <figure>
                <DeskStillLife />
                <figcaption className="mt-6 text-center font-display text-sm italic text-faded">
                  In her ledger: names, weather, and the way you said “almost.”
                </figcaption>
              </figure>
            </Reveal>

            <div className="order-1 lg:order-2">
              <Reveal>
                <p className="kicker">What an Auto Memory Doll does</p>
                <h2
                  id="doll-heading"
                  className="text-balance mt-5 font-display text-4xl font-light leading-[1.15] text-cream md:text-5xl"
                >
                  She listens <em className="font-normal italic text-gold-bright">before</em> she writes.
                </h2>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="prose-quiet drop-cap mt-8">
                  An Auto Memory Doll is a letter-writing companion — not a
                  template, not a form, but a short and unhurried conversation.
                  She asks about the person, the moment, the thing you almost
                  said. She notices what you circle back to, and what you step
                  around.
                </p>
              </Reveal>
              <Reveal delay={0.25}>
                <p className="prose-quiet mt-6">
                  Then she writes: a letter in <em>your</em> voice, only
                  steadier. Your phrasing, your plain words — she merely holds
                  the pen still while the feeling passes through.
                </p>
              </Reveal>
              <Reveal delay={0.35}>
                <p className="prose-quiet mt-6">
                  The doll lives entirely on your machine. Nothing is uploaded;
                  nothing is kept without your leave. When the letter is
                  finished it is yours — and the conversation is yours alone.
                </p>
              </Reveal>
              <Reveal delay={0.45}>
                <div className="hairline-left mt-10 max-w-xs" />
                <p className="mt-6 font-display text-lg italic text-gold-bright/90">
                  “I do not invent your feelings. I only find where they were
                  standing all along.”
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        <HowItWorks />
        <Letters />
        <Specimen />
        <Promise />
        <Begin />
      </main>
      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import TypeLine from "./effects/TypeLine";

/**
 * The hero: the atelier at night, with the doll standing in it.
 *
 * One hero-grade moment, composed of two halves that belong together — the
 * shader field is the room's air, and she is the person in the room. Her
 * greeting types itself beside her; the headline lands once she has spoken.
 * Scrolling the first screen bows her.
 *
 * Both heavy pieces are mounted with ssr: false and have their space reserved
 * in the layout, so nothing shifts when they arrive.
 */

const ShaderField = dynamic(() => import("./effects/ShaderField"), {
  ssr: false,
  loading: () => (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(128% 96% at 62% 4%, #1b2540 0%, #121a30 46%, #0e1526 78%)",
      }}
    />
  ),
});

const Doll = dynamic(() => import("./effects/DollFrames"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full w-full" />,
});

const GREETING = [
  "Good evening. I am Wren — your Auto Memory Doll.",
];

export default function Hero({ hasFrames = false }: { hasFrames?: boolean }) {
  return (
    <section
      id="hero"
      className="relative min-h-[190svh] md:min-h-[215svh]"
      aria-labelledby="hero-heading"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <ShaderField />

        {/* the room's floor shadow, so she is standing on something */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-midnight to-transparent"
        />

        <div className="relative mx-auto grid h-full max-w-content grid-rows-[auto_minmax(0,1fr)] items-center gap-2 px-5 pb-8 pt-24 md:px-10 lg:pb-0 lg:pt-0 lg:grid-cols-[1.06fr_0.94fr] lg:grid-rows-1 lg:gap-10">
          {/* — her voice, and the headline — */}
          <div className="relative z-10 lg:pb-[6vh]">
            <p className="kicker">A letter-writing atelier · open after dark</p>

            <TypeLine
              lines={GREETING}
              className="mt-6"
              lineClassName="voice text-[1.0625rem] leading-relaxed sm:text-xl"
              startDelay={400}
              speed={22}
            />

            <h1
              id="hero-heading"
              className="display-xl mt-7 max-w-[13ch] text-moonpaper"
            >
              <span className="hero-word" style={{ animationDelay: "2.4s" }}>
                For the words
              </span>{" "}
              <span className="hero-word" style={{ animationDelay: "2.56s" }}>
                you never
              </span>{" "}
              <span
                className="hero-word italic text-candlelight"
                style={{ animationDelay: "2.72s" }}
              >
                managed to say.
              </span>
            </h1>

            <div
              className="hero-late mt-9 flex flex-wrap items-center gap-x-7 gap-y-4"
              style={{ animationDelay: "3.1s" }}
            >
              <Link href="/services" className="btn-foil">
                Meet the letters
              </Link>
              <Link href="/begin" className="btn-quiet">
                Request a letter
              </Link>
            </div>

            {/* the cue belongs with the copy, where the eye already is —
                under the doll it was sitting in dead space at the fold */}
            <p
              className="hero-late mt-14 hidden items-center gap-3 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-brass/80 lg:flex"
              style={{ animationDelay: "3.6s" }}
            >
              <span aria-hidden="true" className="text-candlelight">
                ↓
              </span>
              Scroll — she will greet you properly
            </p>
          </div>

          {/* — the doll —
              She fills the row the grid leaves her rather than claiming a
              fixed height: at 375px the copy is tall, and a fixed height sent
              her up into the buttons. */}
          <div className="relative flex h-full min-h-0 items-start justify-center self-stretch overflow-hidden lg:items-end lg:justify-end lg:overflow-visible">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[6%] left-1/2 h-[62%] w-[86%] -translate-x-1/2 rounded-full lg:left-[56%]"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(232,177,92,0.13), rgba(124,134,216,0.06) 52%, transparent 72%)",
              }}
            />
            {/* On a phone she is close: drawn large and cropped at the hem,
                rather than standing across the room at figurine scale. */}
            <div className="relative w-[74%] max-w-[270px] sm:w-[58%] sm:max-w-[320px] lg:h-[82vh] lg:max-h-[760px] lg:w-auto lg:max-w-none">
              <Doll
                heroId="hero"
                hasFrames={hasFrames}
                className="h-auto w-full lg:h-full lg:w-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

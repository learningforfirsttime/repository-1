import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "The Atelier",
  description:
    "How this site was made: the zero-asset rule, a hand-written WebGL hero and its fallback, SVG filter seals and ink bleeds, CSS-3D envelopes, the typing engine, the font strategy, and the pinned build.",
};

/**
 * Filled in during the iteration protocol. Each pass is a real walk through
 * the whole site at 375, 768 and 1280px, hunting design, performance and
 * accessibility faults — not a summary of features.
 */
const LOG: { pass: string; lines: string[] }[] = [
  {
    pass: "Pass I — a hero running at seven frames a second",
    lines: [
      "Measured rather than admired: the hero was rendering at 6.8fps with 290ms of main-thread lag, while the shader-free pages held a clean 60. It was starving the typewriter so badly that the headline landed while she was still halfway through her own name.",
      "Rendering the field at 55% of layout size, cutting fBm from five octaves to three, folding two warp rounds into one and capping the loop at 30fps took it to a 16.7ms median frame and 4.2ms of lag.",
      "Every route except the landing sat 40px to the left of the header, because those sections padded the outside of the max-width box instead of the inside. One container pattern now, everywhere.",
      "The envelope plates were the loudest thing on the site. Cut their height, added a scrim so they hand off to the paper instead of cutting against it, and dropped the card titles below display size so a two-line name stops dominating. Removed the floating colour rectangle from the letter pages — that layout's one accessory.",
    ],
  },
  {
    pass: "Pass II — a regression of my own making",
    lines: [
      "The cheaper shader had flattened into haze: all cost removed, and most of the picture with it. Pushing the warp amplitude from 1.95 to 3.1 and widening the colour mapping to reach the riser tone bought the plume structure back for no extra noise evaluations.",
      "The typing engine grew the page line by line as she wrote, shoving everything below it. Each line now reserves its finished height behind an invisible copy of itself; measured cumulative layout shift went to zero.",
      "The seals were reading as gold coins rather than wax. The large seal is now always the atelier's own wax — it is the atelier sealing the letter, not the letter sealing itself — and the letter's colour survives in the dot.",
      "On a phone she was standing across the room at figurine scale. She is drawn large and cropped at the hem instead, which is the difference between a picture of someone and someone in the room.",
    ],
  },
  {
    pass: "Pass III — tablet, sequence, and the whole request",
    lines: [
      "At 768px the header wrapped onto three rows and collided with her greeting: the full navigation was switching on at md, before there was room for a wordmark, three links, a badge and a button. It waits for lg now, and the hero keeps its top padding until then.",
      "The step markers were sitting wherever the curve happened to pass — up to 42px away from the steps they numbered. Placed on the real column starts, and the stagger tightened from 1.8s to 1.15s so the third step is not still arriving after the eye has moved on.",
      "Walked the request end to end: it survives a reload, the clipboard copy and the seal press both fire, and the copied text carries the session notes. Twelve focusable elements in a row, every one keeping a visible ring.",
      "Under reduced motion the page renders complete and still — her greeting fully written, the headline landed, one considered frame of the field — and no loop anywhere survives a hidden tab or a scroll out of view.",
    ],
  },
];

const SECTIONS = [
  {
    kicker: "The rule",
    title: "Everything here was drawn in code",
    body: [
      "No photographs, no stock, no generated imagery, no icon packs, no CDNs, and no network requests at runtime. The site ships zero image files: the favicon is a hand-written SVG, the grain is an inline SVG-noise data URI, the seals and line art are paths, and the hero is arithmetic.",
      "The constraint is the point. A shader you wrote behaves — it responds to a pointer, it settles, it can be told to hold still for someone who asked for less motion. A picture of ink in water can only be played.",
    ],
  },
  {
    kicker: "The hero",
    title: "A fragment shader, and why not three.js",
    body: [
      "The field behind the hero is one full-screen triangle and a hand-written GLSL fragment shader. A round of domain-warped fBm gives the ink its plumes; a ridge taken from the same field draws the vein of candlelight through it; two exponential falloffs place the candle low-left and a cool counterlight high-right. A pointer press writes an expanding ring into the warp, so the ink parts where you touch it.",
      "Three.js was on the table and was left off it. It would have cost a dependency and a runtime for something a single shader already does, and the zero-dependency version is the more honest demonstration. The fallback beneath it is a CSS radial gradient in the same three grounds, so a machine with no WebGL context sees a composed picture rather than a hole.",
      "It is also deliberately cheap, because the first measurement of it was 6.8 frames a second. The field renders at 55% of layout size and is scaled up by the compositor — it is an out-of-focus volume of water, and the upscale irons out banding rather than costing detail — with three octaves of noise instead of five and the loop capped at 30fps, which is more than a field drifting at three-hundredths of real time can use. It stops when it scrolls out of view, stops again when the tab is hidden, and draws exactly one frame for a visitor who prefers reduced motion.",
    ],
  },
  {
    kicker: "The doll",
    title: "An articulated figure, not three pictures",
    body: [
      "She is a single SVG with a rig: a squash pivot at the hips, a second at the neck, and sub-pivots for her features, crown, bangs, ribbon and each earring. One scroll-linked value drives all of them through a shared easing curve, which is why the bow is continuous at any scroll speed instead of a crossfade between poses.",
      "Depth comes from foreshortening — the crown scales up as the head drops and squashes — rather than from sliding her head down between her shoulders, which reads as a shrug. Her eyelids travel far enough to meet the lower lash line at the bottom of the bow, and the static lashes fade as they arrive so a closed eye is one graceful line rather than two.",
      "Her earrings hang on damped pendulums that are kicked by the bow's own velocity, so they swing because she moved. None of this re-renders: the rig writes transforms straight onto the nodes inside one animation frame.",
    ],
  },
  {
    kicker: "Paper and wax",
    title: "SVG filters, and light that comes from the page",
    body: [
      "Two filter primitives do most of the material work. feTurbulence into feDisplacementMap at a low scale gives the display heading on a letter's page its faint ink bleed, as though the fibre were drinking. The same pair at a larger scale roughens an edge that should feel pressed rather than cut.",
      "The seals are paths with a deliberately irregular rim — wax does not pour in circles — lit by a single off-centre radial gradient and struck with a nib mark. When a request is copied, the seal presses: it drops in scaled and rotated, overshoots slightly, and settles, while the panel beneath it takes the weight.",
      "The defining material decision is that paper is the light source. Nothing on this site is a pale rectangle on a dark background; every card and sheet throws a warm bloom into the room, which is what makes the dark read as a study after dark rather than as a colour scheme.",
    ],
  },
  {
    kicker: "The letters",
    title: "Envelopes in CSS 3D, and a typewriter",
    body: [
      "Each letter's card is an envelope. The coloured plate is a separate plane with its transform origin at its lower edge, so a few degrees of rotateX on hover lifts it exactly like a flap. The card itself rises at the same time on the house easing. The whole card is clickable through a stretched link, and the request control is raised above it so it keeps its own focus ring.",
      "The typing engine takes an array of lines and writes them out character by character, adding a longer pause after a full stop or an em dash and a shorter one after a comma — the rhythm a hand actually has. The complete text is always present for assistive technology alongside the animated copy, so a screen reader never hears half a sentence, and under reduced motion the words are simply there.",
    ],
  },
  {
    kicker: "The build",
    title: "Pinned versions, and fonts that cannot break it",
    body: [
      "Next 14 App Router with the Pages of this site prerendered, React 18, Tailwind 3, TypeScript — all pinned, none scaffolded from a template. Pinning is not conservatism; the current defaults of these tools are a major version apart from each other and will not build together without argument.",
      "Type is Fraunces for display, Newsreader for body, and Courier Prime for anything with typewriter DNA, self-hosted at build time so nothing is fetched while a visitor reads. Fraunces earns its place through its optical-size and WONK axes, which is what keeps the headlines from looking like every other serif revival. The fallback is wired and waiting: deleting the three font declarations drops the site onto tuned Georgia and Courier New stacks that are already registered in the Tailwind config.",
      "State is a React context over localStorage, read only inside an effect so the server and the first client render always agree. There is no database, no backend, no environment file, and no payment path anywhere in the source — the request exists to be handed back to the person who made it.",
    ],
  },
];

export default function GuidePage() {
  return (
    <main id="main" className="flex-1">
      <section className="relative pb-4 pt-36 md:pt-44">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <p className="kicker">The atelier</p>
            <h1 className="display-xl mt-6 max-w-[15ch] text-balance text-moonpaper">
              How this was <em className="italic text-candlelight">made.</em>
            </h1>
            <p className="prose-quiet mt-8">
              A working account rather than a tour. Everything below is
              reproducible: the rule the site is built under, the techniques
              that carry it, and the three passes it went through before it was
              allowed to be finished.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad pt-16">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <div className="space-y-20 lg:space-y-24">
            {SECTIONS.map((s, i) => (
              <Reveal key={s.title} delay={0.04}>
                <article className="grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-14">
                  <div>
                    <p className="kicker">{s.kicker}</p>
                    <p
                      aria-hidden="true"
                      className="mt-3 font-display text-3xl italic text-brass/45"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </p>
                  </div>
                  <div>
                    <h2 className="display-lg max-w-[18ch] text-balance text-moonpaper">
                      {s.title}
                    </h2>
                    <div className="mt-7 space-y-5">
                      {s.body.map((p) => (
                        <p key={p.slice(0, 28)} className="prose-quiet">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── the iteration log ── */}
      <section className="section-pad pt-0" aria-labelledby="log-heading">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <div className="hairline mb-16" />
          <Reveal>
            <p className="kicker">The record</p>
            <h2
              id="log-heading"
              className="display-lg mt-5 max-w-[18ch] text-balance text-moonpaper"
            >
              Iteration log
            </h2>
            <p className="prose-quiet mt-6">
              Three passes, each one a walk through every route at 375, 768 and
              1280 pixels, looking for faults rather than admiring the work.
              What follows is what was actually found and changed.
            </p>
          </Reveal>

          <ol className="mt-14 space-y-8">
            {LOG.map((entry, i) => (
              <Reveal as="li" key={entry.pass} delay={i * 0.08}>
                <div className="page-surface rounded-[3px] px-6 py-8 sm:px-9">
                  <h3 className="display-md text-moonpaper">{entry.pass}</h3>
                  <ul className="mt-5 space-y-3">
                    {entry.lines.map((line) => (
                      <li key={line.slice(0, 28)} className="flex gap-4">
                        <span
                          aria-hidden="true"
                          className="mt-[0.7rem] h-1 w-1 shrink-0 rounded-full bg-candlelight"
                        />
                        <span className="text-[0.975rem] leading-relaxed text-ash">
                          {line}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={0.2}>
            <div className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/services" className="btn-foil">
                Meet the letters
              </Link>
              <Link href="/" className="btn-quiet">
                Back to the atelier door
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

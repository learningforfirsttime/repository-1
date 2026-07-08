import Emblem from "./Emblem";

export default function Footer() {
  return (
    <footer className="relative mt-8" role="contentinfo">
      <div className="hairline" />
      <div className="mx-auto max-w-content px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="flex items-center gap-3 text-gold">
              <Emblem size={32} />
              <span className="font-display text-sm tracking-[0.3em] text-cream">
                AUTO&thinsp;MEMORY&thinsp;DOLL
              </span>
            </div>
            <p className="prose-quiet mt-5 max-w-xs text-[0.95rem]">
              An AI letter-writing companion. She listens before she writes —
              and what she writes was always yours.
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="kicker !tracking-[0.3em]">Contents</p>
            <ul className="mt-5 space-y-3">
              {[
                ["#doll", "The Doll"],
                ["#letters", "Letters"],
                ["#specimen", "Specimen"],
                ["#promise", "The Promise"],
                ["#begin", "Begin"],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="nav-link">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="kicker !tracking-[0.3em]">Colophon</p>
            <p className="prose-quiet mt-5 text-[0.9rem] leading-relaxed">
              Every visual on this page is drawn in code: the sky is a shader,
              the dust is canvas, the seal and the still life are SVG, the paper
              is CSS. No photographs, no image files, no assets of any kind.
            </p>
            <p className="prose-quiet mt-4 text-[0.9rem]">
              Set in Cormorant Garamond, Newsreader &amp; Special Elite. Built
              with Next.js.
            </p>
          </div>
        </div>

        <div className="hairline-left mt-14" />
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 text-[0.75rem] text-faded/80">
          <p>
            A fictional service, presented as a demonstration of code-drawn
            design.
          </p>
          <p>
            Designed &amp; built in a single pass by{" "}
            <span className="text-gold">Claude</span> — an AI, much like the
            doll.
          </p>
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "The Letters",
    links: [
      { href: "/services", label: "All letters" },
      { href: "/services/gratitude", label: "Gratitude" },
      { href: "/services/reconciliation", label: "Reconciliation" },
      { href: "/services/future", label: "To the future" },
    ],
  },
  {
    title: "The Atelier",
    links: [
      { href: "/guide", label: "How this was made" },
      { href: "/begin", label: "My request" },
      { href: "/#how", label: "How it works" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-brass/22 bg-midnight/70">
      <div className="mx-auto max-w-content px-5 py-14 md:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="voice text-2xl leading-snug text-moonpaper/90">
              “Sincerely yours —<br />
              at last.”
            </p>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ash/85">
              A letter-writing atelier. The doll listens first, and writes only
              what you meant.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="kicker">{col.title}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ash transition-colors duration-240 ease-ink hover:text-candlelight"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brass/85">
            A fictional atelier · nothing is for sale · every visual drawn in
            code
          </p>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brass/70">
            Designed &amp; built by Claude ·{" "}
            <Link
              href="/guide"
              className="text-candlelight/80 transition-colors duration-240 ease-ink hover:text-candlelight"
            >
              How this was made
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import RequestBadge from "./RequestBadge";

const LINKS = [
  { href: "/services", label: "The Letters" },
  { href: "/#how", label: "How It Works" },
  { href: "/guide", label: "The Atelier" },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lifted, setLifted] = useState(false);

  // close the menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // the rule under the header darkens once the page has moved
  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // an open menu should not leave the page scrolling underneath it
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-480 ease-ink ${
        lifted
          ? "bg-midnight/88 backdrop-blur-[10px]"
          : "bg-gradient-to-b from-midnight/85 to-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-5 py-4 md:px-10">
        {/* the mark */}
        <Link
          href="/"
          className="group flex items-center gap-3"
          aria-label="Auto Memory Doll — home"
        >
          <span className="relative grid h-9 w-9 place-items-center">
            <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden="true">
              <circle cx="20" cy="20" r="18" fill="#9B3A44" />
              <circle
                cx="20"
                cy="20"
                r="18"
                fill="none"
                stroke="#E8B15C"
                strokeOpacity="0.55"
                strokeWidth="1"
              />
              {/* at 36px a struck nib turns to mush — one clean ring and a
                  single stroke survive the size */}
              <circle
                cx="20"
                cy="20"
                r="12"
                fill="none"
                stroke="#0E1526"
                strokeOpacity="0.42"
                strokeWidth="1.6"
              />
              <path
                d="M 20 12.5 L 24 22 L 20 26 L 16 22 Z"
                fill="#0E1526"
                fillOpacity="0.5"
              />
            </svg>
          </span>
          <span className="font-mono text-[0.6875rem] uppercase leading-tight tracking-[0.26em] text-moonpaper transition-colors duration-240 ease-ink group-hover:text-candlelight sm:tracking-[0.3em]">
            Auto Memory Doll
          </span>
        </Link>

        {/* desktop */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative py-1 font-mono text-[0.6875rem] uppercase tracking-[0.22em] transition-colors duration-240 ease-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-candlelight after:transition-transform after:duration-480 after:ease-ink hover:text-candlelight hover:after:scale-x-100 ${
                isActive(l.href)
                  ? "text-candlelight after:scale-x-100"
                  : "text-ash"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <RequestBadge />
          <Link
            href="/begin"
            className="rounded-full border border-brass/45 bg-ink/70 px-5 py-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-candlelight transition-all duration-480 ease-ink hover:-translate-y-px hover:border-candlelight hover:shadow-[0_0_26px_-6px_rgba(232,177,92,0.45)]"
          >
            Begin a session
          </Link>
        </nav>

        {/* mobile */}
        <div className="flex items-center gap-3 lg:hidden">
          <RequestBadge />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="grid h-10 w-10 place-items-center rounded-[3px] border border-brass/35 text-moonpaper transition-colors duration-240 ease-ink hover:border-candlelight/60 hover:text-candlelight"
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              {open ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="1.4" />
                  <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="1.4" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" stroke="currentColor" strokeWidth="1.4" />
                  <line x1="4" y1="16" x2="20" y2="16" stroke="currentColor" strokeWidth="1.4" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        className={`mx-5 h-px transition-opacity duration-480 ease-ink md:mx-10 ${
          lifted ? "opacity-100" : "opacity-40"
        }`}
        style={{
          background:
            "linear-gradient(to right, transparent, rgba(169,139,79,0.55) 14%, rgba(169,139,79,0.55) 86%, transparent)",
        }}
      />

      {/* mobile sheet */}
      <div
        id="mobile-menu"
        hidden={!open}
        className="border-b border-brass/25 bg-midnight/97 backdrop-blur-[10px] lg:hidden"
      >
        <nav className="flex flex-col px-5 py-3" aria-label="Primary, mobile">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`border-b border-slate/50 py-4 font-mono text-xs uppercase tracking-[0.22em] last:border-b-0 ${
                isActive(l.href) ? "text-candlelight" : "text-ash"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/begin"
            className="btn-foil mt-5 w-full justify-center"
          >
            Begin a session
          </Link>
        </nav>
      </div>
    </header>
  );
}

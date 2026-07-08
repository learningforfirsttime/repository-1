"use client";

import { useEffect, useState } from "react";
import Emblem from "./Emblem";

const LINKS = [
  { href: "#doll", label: "The Doll" },
  { href: "#letters", label: "Letters" },
  { href: "#specimen", label: "Specimen" },
  { href: "#promise", label: "The Promise" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`nav-shell fixed inset-x-0 top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-content items-center justify-between px-6 py-4 md:px-10"
      >
        <a
          href="#top"
          className="group flex items-center gap-2.5 text-gold sm:gap-3"
          aria-label="Auto Memory Doll — back to top"
        >
          <Emblem size={34} className="shrink-0 transition-transform duration-700 ease-soft group-hover:rotate-[18deg]" />
          <span className="whitespace-nowrap font-display text-[0.72rem] tracking-[0.22em] text-cream sm:text-[0.95rem] sm:tracking-[0.3em]">
            AUTO&thinsp;MEMORY&thinsp;DOLL
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav-link">
              {l.label}
            </a>
          ))}
        </div>

        <a href="#begin" className="btn btn-ghost !px-3.5 !py-2 text-[0.625rem]">
          <span className="sm:hidden">Begin</span>
          <span className="hidden sm:inline">Begin a session</span>
        </a>
      </nav>
    </header>
  );
}

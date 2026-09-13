"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/lib/useInView";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * TypeLine — the doll taking something down.
 *
 * Types one or more lines character by character, pausing a beat longer at
 * sentence ends the way a hand does. The animated text is hidden from
 * assistive technology and the complete text is exposed alongside it, so a
 * screen reader never hears a half-written sentence.
 *
 * Under reduced motion the text is simply present.
 */

type Props = {
  lines: string[];
  className?: string;
  lineClassName?: string;
  startDelay?: number;
  /** milliseconds per character, before jitter */
  speed?: number;
  caret?: boolean;
  /** wait until scrolled into view before starting */
  onVisible?: boolean;
  as?: "p" | "div";
};

export default function TypeLine({
  lines,
  className = "",
  lineClassName = "",
  startDelay = 400,
  speed = 34,
  caret = true,
  onVisible = false,
  as = "div",
}: Props) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const [shown, setShown] = useState<string[]>(() => lines.map(() => ""));
  const [done, setDone] = useState(false);
  const timer = useRef<number | null>(null);

  const armed = onVisible ? inView : true;
  const full = lines.join(" ");

  useEffect(() => {
    if (reduced || !armed) return;

    let cancelled = false;
    let li = 0;
    let ci = 0;
    const out = lines.map(() => "");

    const step = () => {
      if (cancelled) return;
      if (li >= lines.length) {
        setDone(true);
        return;
      }
      const line = lines[li];
      out[li] = line.slice(0, ci);
      setShown([...out]);

      const prev = line[ci - 1];
      let delay = speed + Math.random() * 18;
      if (prev === "." || prev === "—" || prev === ":") delay += 240;
      else if (prev === "," || prev === ";") delay += 110;

      ci += 1;
      if (ci > line.length) {
        li += 1;
        ci = 0;
        delay += 360; // a breath between lines
      }
      timer.current = window.setTimeout(step, delay);
    };

    timer.current = window.setTimeout(step, startDelay);

    return () => {
      cancelled = true;
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [lines, reduced, armed, speed, startDelay]);

  const still = reduced || !armed;
  const visible = still ? lines : shown;
  const showCaret = caret && !still && !done;
  // the line currently being written — where the caret belongs
  const activeLine = still
    ? -1
    : visible.findIndex((l, j) => l.length < lines[j].length);
  const Tag = as;

  return (
    <div ref={ref} className={className}>
      <span className="sr-only">{full}</span>
      <Tag aria-hidden="true">
        {lines.map((line, i) => (
          /*
           * Each line reserves its finished height with an invisible copy and
           * writes the typed text over the top. Without this the block grows
           * line by line and shoves the page around as she writes.
           */
          <span key={i} className={`relative block ${lineClassName}`}>
            <span className="invisible">{line}</span>
            <span className="absolute left-0 top-0 w-full">
              {visible[i]}
              {showCaret && i === activeLine && <span className="caret" />}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}

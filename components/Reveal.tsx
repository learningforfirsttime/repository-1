"use client";

import type { CSSProperties, ReactNode } from "react";
import { useInView } from "@/lib/useInView";

/**
 * The house rise. Everything that arrives on scroll arrives through this, so
 * the whole site shares one timing.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  threshold = 0.18,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  threshold?: number;
  as?: "div" | "li" | "section" | "figure";
}) {
  const { ref, inView } = useInView<HTMLDivElement>(threshold);

  return (
    <Tag
      // one ref type across the union keeps this simple and correct at runtime
      ref={ref as never}
      className={`reveal ${inView ? "is-in" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}

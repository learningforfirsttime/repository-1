"use client";

import Link from "next/link";
import { useRequest } from "@/lib/request";

/**
 * The live count of letters in the visitor's request. Renders nothing at all
 * until the request has been read from storage, so there is no flash of a
 * wrong number and no hydration disagreement.
 */
export default function RequestBadge({
  className = "",
}: {
  className?: string;
}) {
  const { hydrated, selected } = useRequest();
  const count = selected.length;

  if (!hydrated || count === 0) return null;

  return (
    <Link
      href="/begin"
      className={`group inline-flex items-center gap-2 rounded-full border border-brass/40 bg-slate/40 px-3 py-1.5 transition-colors duration-240 ease-ink hover:border-candlelight/60 ${className}`}
      aria-label={`My request: ${count} ${count === 1 ? "letter" : "letters"}`}
    >
      <span
        aria-hidden="true"
        className="inline-block h-1.5 w-1.5 rounded-full bg-candlelight"
      />
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-ash transition-colors duration-240 ease-ink group-hover:text-candlelight">
        My request
      </span>
      <span className="font-mono text-[0.6875rem] tabular-nums text-candlelight">
        {count}
      </span>
    </Link>
  );
}

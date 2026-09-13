"use client";

import { useRequest } from "@/lib/request";

/**
 * Adds a letter to the visitor's request, or takes it back out. Nothing is
 * purchased; the control simply says what it does, and then says what it did.
 */
export default function AddToRequestButton({
  id,
  variant = "card",
  className = "",
}: {
  id: string;
  variant?: "card" | "detail";
  className?: string;
}) {
  const { hydrated, has, toggle } = useRequest();
  const inRequest = hydrated && has(id);

  const base =
    variant === "detail"
      ? "btn-outline w-full sm:w-auto"
      : "inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.2em] transition-colors duration-240 ease-ink";

  const tone =
    variant === "detail"
      ? inRequest
        ? "border-candlelight/60 text-candlelight"
        : ""
      : inRequest
        ? "text-candlelight"
        : "text-ash hover:text-candlelight";

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={inRequest}
      className={`${base} ${tone} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full transition-colors duration-240 ease-ink ${
          inRequest ? "bg-candlelight" : "bg-brass/60"
        }`}
      />
      {inRequest ? "In my request" : "Request this letter"}
    </button>
  );
}

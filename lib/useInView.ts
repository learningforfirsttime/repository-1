"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Fires once when an element first enters the viewport. Used for every
 * reveal and every self-inking SVG on the site.
 */
export function useInView<T extends HTMLElement>(
  threshold = 0.2,
  rootMargin = "0px 0px -8% 0px"
): { ref: RefObject<T>; inView: boolean } {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No observer (very old browsers, some test runners): show everything.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold, rootMargin }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return { ref, inView };
}

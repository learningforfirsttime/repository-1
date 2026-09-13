"use client";

import Link from "next/link";
import type { Service } from "@/lib/services";
import AddToRequestButton from "./AddToRequestButton";

/**
 * A letter, as an envelope on the tray.
 *
 * Each card carries its own two-tone plate — the only place on the site where
 * colour varies per item — and tilts open a few degrees in CSS 3D on hover,
 * as though the flap were being lifted. The whole card is clickable via a
 * stretched link; the request control sits above it.
 */
export default function ServiceCard({ service }: { service: Service }) {
  return (
    <article className="stage-3d group relative h-full">
      <div className="page-surface relative flex h-full flex-col overflow-hidden rounded-[3px] transition-transform duration-480 ease-ink group-hover:-translate-y-1.5 group-focus-within:-translate-y-1.5">
        {/* the plate — the envelope's own colour */}
        <div
          className="relative h-24 origin-bottom transition-transform duration-480 ease-ink group-hover:[transform:rotateX(-14deg)] group-focus-within:[transform:rotateX(-14deg)] sm:h-[6.5rem]"
          style={{
            backgroundImage: `linear-gradient(152deg, ${service.plate.from}, ${service.plate.to})`,
          }}
        >
          {/* the flap crease, and a scrim so the plate hands off to the paper
              instead of cutting against it */}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.14), rgba(0,0,0,0.16) 55%, rgba(14,21,38,0.55))",
            }}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 400 120"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <path
              d="M 0 0 L 200 78 L 400 0"
              fill="none"
              stroke="rgba(14,21,38,0.4)"
              strokeWidth="1.4"
            />
          </svg>
          {/* the wax dot */}
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[62%] h-4 w-4 -translate-x-1/2 rounded-full shadow-seal"
            style={{ background: service.seal }}
          />
        </div>

        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <p className="micro">{service.sessionNote}</p>
          <h3
            className="mt-3 font-display text-[1.375rem] leading-[1.2] text-moonpaper"
            style={{ fontVariationSettings: '"opsz" 48, "SOFT" 12' }}
          >
            <Link
              href={`/services/${service.id}`}
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
            >
              {service.name}
            </Link>
          </h3>
          <p className="mt-3 text-[0.975rem] leading-relaxed text-ash">
            {service.tagline}
          </p>

          <div className="mt-auto pt-6">
            <div className="hairline-left mb-5" />
            <div className="relative z-10 flex items-center justify-between gap-4">
              <AddToRequestButton id={service.id} />
              <span
                aria-hidden="true"
                className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-brass transition-colors duration-240 ease-ink group-hover:text-candlelight"
              >
                Read →
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

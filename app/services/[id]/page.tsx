import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICES, getService, getRelated } from "@/lib/services";
import AddToRequestButton from "@/components/AddToRequestButton";
import Reveal from "@/components/Reveal";
import ServiceCard from "@/components/ServiceCard";
import TypeLine from "@/components/effects/TypeLine";
import WaxSeal from "@/components/effects/WaxSeal";

type Params = { params: { id: string } };

export function generateStaticParams() {
  return SERVICES.map((s) => ({ id: s.id }));
}

export function generateMetadata({ params }: Params): Metadata {
  const service = getService(params.id);
  if (!service) return { title: "Letter not found" };
  return {
    title: service.name,
    description: `${service.tagline} ${service.sessionNote}, in your own voice.`,
  };
}

export default function ServiceDetail({ params }: Params) {
  const service = getService(params.id);
  if (!service) notFound();

  const related = getRelated(service);

  return (
    <main id="main" className="flex-1">
      {/* ── the letter's own plate ── */}
      <section className="relative pb-6 pt-36 md:pt-44">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <Link
              href="/services"
              className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-brass transition-colors duration-240 ease-ink hover:text-candlelight"
            >
              ← All letters
            </Link>
          </Reveal>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-3xl">
              <Reveal>
                <div className="flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 rounded-full shadow-seal"
                    style={{ background: service.seal }}
                  />
                  <p className="micro">{service.sessionNote}</p>
                </div>
              </Reveal>
              <Reveal delay={0.08}>
                {/* the ink bleeds very slightly into the paper */}
                <h1 className="display-lg ink-bleed mt-5 text-balance text-moonpaper">
                  {service.name}
                </h1>
              </Reveal>
              <Reveal delay={0.16}>
                <p className="prose-quiet mt-6 text-[1.125rem]">
                  {service.tagline}
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── the excerpt, written out line by line ── */}
      <section className="py-12" aria-label="An excerpt">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <figure className="sheet relative mx-auto max-w-3xl rounded-[2px] px-7 py-12 sm:px-14 sm:py-16">
              <figcaption className="font-mono text-[0.625rem] uppercase tracking-[0.24em] text-[#6B5B3E]">
                From a letter of this kind
              </figcaption>

              <TypeLine
                lines={service.excerpt}
                onVisible
                startDelay={500}
                speed={26}
                className="mt-7"
                lineClassName="font-display text-[1.25rem] leading-[1.62] text-[#2A2418] sm:text-[1.5rem]"
              />

              <div className="mt-10 flex items-end justify-between gap-6">
                <p className="font-display text-sm italic text-[#6B5B3E]">
                  — taken down by Wren, and left for you to change
                </p>
                <WaxSeal size={44} color="#9B3A44" />
              </div>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* ── who it is for, what she will ask ── */}
      <section className="section-pad pt-8" aria-label="About this letter">
        <div className="mx-auto grid max-w-content gap-14 px-5 md:px-10 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="kicker">Who this letter is for</p>
            <p className="prose-quiet mt-6">{service.who}</p>

            <div className="hairline-left mt-10 max-w-[16rem]" />

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <AddToRequestButton id={service.id} variant="detail" />
              <Link href="/begin" className="btn-foil">
                Begin now
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="kicker">What she will ask</p>
            <ol className="mt-7 space-y-6">
              {service.questions.map((q, i) => (
                <li key={q} className="flex gap-5">
                  <span
                    aria-hidden="true"
                    className="mt-1 font-mono text-[0.6875rem] tracking-[0.24em] text-candlelight"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="voice text-[1.0625rem] leading-relaxed sm:text-lg">
                    “{q}”
                  </p>
                </li>
              ))}
            </ol>
            <p className="mt-8 max-w-sm text-sm leading-relaxed text-ash/85">
              She will follow wherever the answers go. These are simply where
              she starts.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── related ── */}
      {related.length > 0 && (
        <section className="section-pad pt-0" aria-labelledby="related-heading">
          <div className="mx-auto max-w-content px-5 md:px-10">
            <div className="hairline mb-14" />
            <Reveal>
              <h2 id="related-heading" className="display-md text-moonpaper">
                Often written alongside
              </h2>
            </Reveal>
            <ul className="mt-9 grid gap-6 sm:grid-cols-2 sm:gap-7">
              {related.map((r, i) => (
                <Reveal as="li" key={r.id} delay={i * 0.1} className="h-full">
                  <ServiceCard service={r} />
                </Reveal>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}

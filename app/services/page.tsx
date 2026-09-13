import type { Metadata } from "next";
import Link from "next/link";
import { SERVICES } from "@/lib/services";
import ServiceCard from "@/components/ServiceCard";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "The Letters",
  description:
    "Five kinds of letter the atelier writes: gratitude, reconciliation, a letter to the future, a farewell, and the confession you cannot say out loud.",
};

export default function ServicesPage() {
  return (
    <main id="main" className="flex-1">
      <section className="relative pb-4 pt-36 md:pt-44">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <p className="kicker">The letters</p>
            <h1 className="display-xl mt-6 max-w-[14ch] text-balance text-moonpaper">
              Five ways to <em className="italic text-candlelight">finally</em>{" "}
              say it.
            </h1>
            <p className="prose-quiet mt-8">
              Each kind of letter changes what the doll asks you. Choose the one
              that fits — or add several to your request and decide during the
              session. Nothing here costs anything.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad pt-14" aria-label="All letters">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <ul className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3">
            {SERVICES.map((service, i) => (
              <Reveal
                as="li"
                key={service.id}
                delay={i * 0.08}
                className="h-full"
              >
                <ServiceCard service={service} />
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.2}>
            <div className="page-surface mt-10 flex flex-col items-start justify-between gap-6 rounded-[3px] px-7 py-9 sm:flex-row sm:items-center">
              <div>
                <h2 className="display-md text-moonpaper">
                  Not sure which one?
                </h2>
                <p className="mt-2 max-w-md text-[0.975rem] leading-relaxed text-ash">
                  Begin a session anyway. The first thing she asks is who you
                  are writing to, and the kind usually answers itself.
                </p>
              </div>
              <Link href="/begin" className="btn-foil shrink-0">
                Begin a session
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

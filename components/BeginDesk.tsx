"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRequest } from "@/lib/request";
import { SERVICES, getService } from "@/lib/services";
import Reveal from "./Reveal";
import WaxSeal from "./effects/WaxSeal";

/**
 * The writing desk.
 *
 * Everything the visitor has chosen, laid out as objects rather than as a
 * checkout — because nothing here is bought. The only action is to copy the
 * request into their own clipboard, which the doll acknowledges by pressing
 * a seal onto it.
 *
 * There is no payment field anywhere in this file, by design.
 */

/** No session room yet; the control stays alive and says so honestly. */
const APP_LINK: string | null = null;
const CONTACT_LINK: string | null = null;

export default function BeginDesk() {
  const { hydrated, selected, intake, remove, updateIntake, clear } =
    useRequest();
  const [sealed, setSealed] = useState(false);
  const [notice, setNotice] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const resetTimer = useRef<number | null>(null);

  const letters = selected
    .map((id) => getService(id))
    .filter((s): s is (typeof SERVICES)[number] => Boolean(s));

  const buildRequest = () => {
    const lines: string[] = [];
    lines.push("MY REQUEST — AUTO MEMORY DOLL");
    lines.push("");
    if (letters.length) {
      lines.push("Letters");
      for (const l of letters) lines.push(`  · ${l.name} (${l.sessionNote})`);
    } else {
      lines.push("Letters");
      lines.push("  · (none chosen yet)");
    }
    const { recipient, occasion, feeling } = intake;
    if (recipient || occasion || feeling) {
      lines.push("");
      lines.push("Notes for the session");
      if (recipient) lines.push(`  Recipient: ${recipient}`);
      if (occasion) lines.push(`  Occasion: ${occasion}`);
      if (feeling) lines.push(`  Feeling to convey: ${feeling}`);
    }
    lines.push("");
    lines.push("Nothing was sent. This text exists only on your machine.");
    return lines.join("\n");
  };

  const copyFallback = (text: string) => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.top = "-1000px";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const handleCopy = async () => {
    const text = buildRequest();
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = copyFallback(text);

    if (ok) {
      setSealed(false);
      // let the class drop before re-applying, so the press replays
      window.requestAnimationFrame(() => setSealed(true));
      setNotice("Sealed & copied — your request is on the clipboard.");
      panelRef.current?.classList.remove("desk-settle");
      void panelRef.current?.offsetWidth;
      panelRef.current?.classList.add("desk-settle");
    } else {
      setNotice(
        "The clipboard would not open. Select the summary below and copy it by hand."
      );
    }

    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setNotice(""), 6000);
  };

  return (
    <main id="main" className="flex-1">
      <section className="relative pb-4 pt-36 md:pt-44">
        <div className="mx-auto max-w-content px-5 md:px-10">
          <Reveal>
            <p className="kicker">My request</p>
            <h1 className="display-xl mt-6 max-w-[15ch] text-balance text-moonpaper">
              The desk is <em className="italic text-candlelight">ready</em>{" "}
              when you are.
            </h1>
            <p className="prose-quiet mt-8">
              Everything below stays on your machine. When you are ready, copy
              the request and bring it to your session — or simply keep it, and
              write the letter yourself.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad pt-12">
        <div className="mx-auto grid max-w-content gap-10 px-5 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
          {/* ── the desk itself ── */}
          <div ref={panelRef}>
            <Reveal>
              <div className="page-surface rounded-[3px] px-6 py-8 sm:px-9 sm:py-10">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 className="display-md text-moonpaper">Chosen letters</h2>
                  {hydrated && letters.length > 0 && (
                    <button
                      type="button"
                      onClick={clear}
                      className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brass transition-colors duration-240 ease-ink hover:text-wax"
                    >
                      Clear the desk
                    </button>
                  )}
                </div>

                <div className="mt-7">
                  {!hydrated ? (
                    <p className="text-sm text-ash/70">Opening the drawer…</p>
                  ) : letters.length === 0 ? (
                    <div className="rounded-[2px] border border-dashed border-brass/35 px-6 py-10 text-center">
                      <p className="voice text-lg text-moonpaper/90">
                        “Nothing on the desk yet.”
                      </p>
                      <p className="mx-auto mt-3 max-w-sm text-[0.95rem] leading-relaxed text-ash">
                        Choose a kind of letter and it will appear here. You can
                        change your mind at any point, including during the
                        session.
                      </p>
                      <Link
                        href="/services"
                        className="btn-outline mt-7 inline-flex"
                      >
                        See the letters
                      </Link>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {letters.map((l) => (
                        <li
                          key={l.id}
                          className="group flex items-center gap-4 rounded-[2px] border border-brass/22 bg-midnight/45 px-4 py-4 transition-colors duration-240 ease-ink hover:border-brass/45"
                        >
                          <span
                            aria-hidden="true"
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ background: l.seal }}
                          />
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/services/${l.id}`}
                              className="font-display text-lg text-moonpaper transition-colors duration-240 ease-ink hover:text-candlelight"
                            >
                              {l.name}
                            </Link>
                            <p className="font-mono text-[0.625rem] uppercase tracking-[0.18em] text-brass/85">
                              {l.sessionNote}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(l.id)}
                            className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.18em] text-ash/70 transition-colors duration-240 ease-ink hover:text-wax"
                          >
                            Remove
                            <span className="sr-only"> {l.name}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* ── notes for the session ── */}
                <div className="hairline my-9" />

                <h2 className="display-md text-moonpaper">
                  Notes for the session
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ash/85">
                  Optional, and never submitted anywhere. They simply travel
                  with your request.
                </p>

                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <label className="block sm:col-span-1">
                    <span className="micro">Who is it for</span>
                    <input
                      type="text"
                      className="field mt-2"
                      value={intake.recipient}
                      onChange={(e) =>
                        updateIntake({ recipient: e.target.value })
                      }
                      placeholder="A name, or “my sister”"
                      autoComplete="off"
                    />
                  </label>

                  <label className="block sm:col-span-1">
                    <span className="micro">The occasion</span>
                    <input
                      type="text"
                      className="field mt-2"
                      value={intake.occasion}
                      onChange={(e) =>
                        updateIntake({ occasion: e.target.value })
                      }
                      placeholder="A birthday, a leaving, no occasion at all"
                      autoComplete="off"
                    />
                  </label>

                  <label className="block sm:col-span-2">
                    <span className="micro">One feeling to convey</span>
                    <input
                      type="text"
                      className="field mt-2"
                      value={intake.feeling}
                      onChange={(e) => updateIntake({ feeling: e.target.value })}
                      placeholder="If the letter said only one thing, what should it say?"
                      autoComplete="off"
                    />
                  </label>
                </div>

                {/* ── the seal ── */}
                <div className="mt-9 flex flex-wrap items-center gap-5">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="btn-foil"
                  >
                    Copy my request
                  </button>

                  <span className="relative grid h-[4.5rem] w-[4.5rem] place-items-center">
                    {sealed && (
                      <WaxSeal
                        size={66}
                        pressed
                        color="#9B3A44"
                        title="Sealed"
                      />
                    )}
                  </span>
                </div>

                <p
                  aria-live="polite"
                  className="mt-4 min-h-[1.5rem] font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-candlelight"
                >
                  {notice}
                </p>
              </div>
            </Reveal>
          </div>

          {/* ── the hand-off ── */}
          <div className="space-y-6">
            <Reveal delay={0.1}>
              <div className="page-surface rounded-[3px] px-6 py-8 sm:px-8 sm:py-10">
                <h2 className="display-md text-moonpaper">Begin a session</h2>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ash">
                  The session room is still being furnished. Nothing is charged
                  for, now or later.
                </p>

                <div className="mt-7 space-y-3">
                  {APP_LINK ? (
                    <a href={APP_LINK} className="btn-foil w-full justify-center">
                      Begin a session
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setNotice(
                          "The session room opens soon — the doll is still learning to listen."
                        )
                      }
                      className="btn-foil w-full justify-center"
                    >
                      Opening soon
                    </button>
                  )}

                  {CONTACT_LINK ? (
                    <a
                      href={CONTACT_LINK}
                      className="btn-outline w-full justify-center"
                    >
                      Write to the atelier
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setNotice(
                          "Correspondence with the atelier opens alongside the session room."
                        )
                      }
                      className="btn-outline w-full justify-center"
                    >
                      Contact — coming soon
                    </button>
                  )}
                </div>

                <div className="hairline my-7" />

                <ul className="space-y-2.5">
                  {[
                    "Private — everything runs on your own machine",
                    "About fifteen minutes, unhurried",
                    "Free while the atelier is in development",
                  ].map((line) => (
                    <li key={line} className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-candlelight"
                      />
                      <span className="text-[0.9rem] leading-relaxed text-ash">
                        {line}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="rounded-[3px] border border-brass/22 px-6 py-7 sm:px-8">
                <p className="voice text-lg leading-relaxed">
                  “Bring me the parts you cannot arrange. Arranging them is my
                  half of the work.”
                </p>
                <p className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brass">
                  — Wren, your Auto Memory Doll
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center py-40">
      <div className="mx-auto max-w-content px-5 md:px-10">
        <p className="kicker">Not in the ledger</p>
        <h1 className="display-xl mt-6 max-w-[14ch] text-balance text-moonpaper">
          She has no letter by that <em className="italic text-candlelight">name.</em>
        </h1>
        <p className="prose-quiet mt-8">
          The page you asked for is not one the atelier keeps. Nothing is lost —
          your request is exactly where you left it.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link href="/services" className="btn-foil">
            See the letters
          </Link>
          <Link href="/" className="btn-quiet">
            Back to the door
          </Link>
        </div>
      </div>
    </main>
  );
}

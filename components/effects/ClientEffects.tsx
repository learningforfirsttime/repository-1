"use client";

import dynamic from "next/dynamic";

/**
 * Effects that must never run on the server and must never delay first paint.
 * Mounted from the layout through this one client boundary, because
 * `ssr: false` is not permitted inside a Server Component.
 */

const InkCursor = dynamic(() => import("./InkCursor"), { ssr: false });

export default function ClientEffects() {
  return <InkCursor />;
}

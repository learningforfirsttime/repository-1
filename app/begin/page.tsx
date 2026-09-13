import type { Metadata } from "next";
import BeginDesk from "@/components/BeginDesk";

export const metadata: Metadata = {
  title: "My Request",
  description:
    "Gather the letters you would like written, add a note or two for the session, and copy the request to your own clipboard. Nothing is sent, and nothing is for sale.",
};

export default function BeginPage() {
  return <BeginDesk />;
}

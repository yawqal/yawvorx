import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";

export const metadata: Metadata = { title: "Digital Product Policy", description: "Digital Product Policy for Zika Go (draft template pending owner review)." };

export default function Page() {
  return <PolicyPage slug="digital" />;
}

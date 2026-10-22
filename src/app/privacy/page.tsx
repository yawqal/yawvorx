import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { canonicalUrl } from "@/lib/seo";
export const metadata: Metadata = { title: "Privacy Policy", description: "Privacy Policy for YAWVOREX (draft template pending owner review).", alternates: { canonical: canonicalUrl("/privacy") } };

export default function Page() {
  return <PolicyPage slug="privacy" />;
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { canonicalUrl } from "@/lib/seo";
export const metadata: Metadata = { title: "Digital Product Policy", description: "Digital Product Policy for YAWVOREX (draft template pending owner review).", alternates: { canonical: canonicalUrl("/digital-policy") } };

export default function Page() {
  return <PolicyPage slug="digital" />;
}

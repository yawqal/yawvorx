import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { canonicalUrl } from "@/lib/seo";
export const metadata: Metadata = { title: "Returns and Refunds", description: "Returns and Refunds for YAWVOREX (draft template pending owner review).", alternates: { canonical: canonicalUrl("/returns") } };

export default function Page() {
  return <PolicyPage slug="returns" />;
}

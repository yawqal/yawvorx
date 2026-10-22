import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";
import { canonicalUrl } from "@/lib/seo";
export const metadata: Metadata = { title: "Shipping Policy", description: "Shipping Policy for YAWVOREX (draft template pending owner review).", alternates: { canonical: canonicalUrl("/shipping-policy") } };

export default function Page() {
  return <PolicyPage slug="shipping" />;
}

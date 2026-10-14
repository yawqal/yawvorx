import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";

export const metadata: Metadata = { title: "Returns and Refunds", description: "Returns and Refunds for YAWVOREX (draft template pending owner review)." };

export default function Page() {
  return <PolicyPage slug="returns" />;
}

import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";

export const metadata: Metadata = { title: "Terms and Conditions", description: "Terms and Conditions for YAWVOREX (draft template pending owner review)." };

export default function Page() {
  return <PolicyPage slug="terms" />;
}

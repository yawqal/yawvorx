import type { Metadata } from "next";
import { PolicyPage } from "@/components/layout/PolicyPage";

export const metadata: Metadata = { title: "Privacy Policy", description: "Privacy Policy for YAWVOREX (draft template pending owner review)." };

export default function Page() {
  return <PolicyPage slug="privacy" />;
}

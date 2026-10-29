import type { Metadata } from "next";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AI Tools & Services",
  description: "Discover ZIKA's AI-enhanced creative and digital services.",
  alternates: { canonical: canonicalUrl("/ai-tools") },
  robots: { index: true, follow: true },
};

export default function AiToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

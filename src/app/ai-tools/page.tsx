import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "AI Tools", description: "AI tools from ZIKA are coming soon.", robots: { index: false, follow: false } };
export default function AiToolsPage() { return <ComingSoon title="AI Tools" accent="green" />; }

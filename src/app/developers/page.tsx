import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Developers", description: "Developer resources from ZIKA are coming soon.", robots: { index: false, follow: false } };
export default function DevelopersPage() { return <ComingSoon title="Developers" accent="blue" />; }

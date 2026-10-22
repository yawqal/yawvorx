import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Affiliate", description: "The ZIKA affiliate program is coming soon.", robots: { index: false, follow: false } };
export default function AffiliatePage() { return <ComingSoon title="Affiliate" accent="orange" />; }

import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Vendors", description: "The ZIKA vendor marketplace is coming soon.", robots: { index: false, follow: false } };
export default function VendorsPage() { return <ComingSoon title="Vendors" accent="emerald" />; }

import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Directory", description: "The ZIKA directory is coming soon.", robots: { index: false, follow: false } };
export default function DirectoryPage() { return <ComingSoon title="Directory" accent="amber" />; }

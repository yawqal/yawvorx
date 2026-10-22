import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Freelancers", description: "Freelancer marketplace from ZIKA is coming soon.", robots: { index: false, follow: false } };
export default function FreelancersPage() { return <ComingSoon title="Freelancers" accent="cyan" />; }

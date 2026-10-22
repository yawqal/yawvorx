import type { Metadata } from "next";
import { ComingSoon } from "@/components/marketplace/ComingSoon";
export const metadata: Metadata = { title: "Subscriptions", description: "Subscriptions from ZIKA are coming soon.", robots: { index: false, follow: false } };
export default function SubscriptionsPage() { return <ComingSoon title="Subscriptions" accent="pink" />; }

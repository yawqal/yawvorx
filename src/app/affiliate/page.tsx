import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { canonicalUrl } from "@/lib/seo";
import { getCurrentUser } from "@/lib/auth";
export const metadata: Metadata = { title: "Affiliate program", description: "Learn how referrals, commissions, and affiliate payouts work.", alternates: { canonical: canonicalUrl("/affiliate") } };
export default async function AffiliatePage() {
  const user = await getCurrentUser();
  return <>
    <PageHeader title="Affiliate program" intro="Refer customers to the marketplace and follow your referrals in your account." />
    <Container className="max-w-4xl py-8 sm:py-10">
      <div className="grid gap-4">
        <Card><h2 className="text-xl font-semibold">How referrals work</h2><p className="mt-2 leading-relaxed text-ink-mute">Share your referral link. When a customer follows it and makes a qualifying purchase, the referral is recorded according to the program terms.</p></Card>
        <Card><h2 className="text-xl font-semibold">Referral attribution</h2><p className="mt-2 leading-relaxed text-ink-mute">The referral cookie duration is configurable by the administrator and may change.</p></Card>
        <Card><h2 className="text-xl font-semibold">Commission and payout</h2><p className="mt-2 leading-relaxed text-ink-mute">Commission is set by the administrator. Eligible commission becomes payable after the applicable return window and payouts are processed manually by bank transfer.</p></Card>
        <div><Button href={user ? "/account/earnings" : "/login?next=%2Faccount%2Fearnings"}>View affiliate earnings</Button></div>
      </div>
    </Container>
  </>;
}

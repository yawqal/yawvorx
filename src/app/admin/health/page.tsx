import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { siteConfig, isConfigured } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Health check", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function HealthCheck() {
  await requireAdmin();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const checks = [
    ["Supabase environment", getSupabaseEnv() !== null],
    ["Site URL", isConfigured(siteUrl) && /^https?:\/\//.test(siteUrl)],
    ["Contact email", isConfigured(siteConfig.contact.email) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(siteConfig.contact.email)],
    ["WhatsApp", isConfigured(siteConfig.contact.whatsapp) && siteConfig.contact.whatsapp.replace(/\D/g, "").length >= 8],
    ["Payment instructions", isConfigured(siteConfig.manualPaymentInstructions)],
  ] as const;

  return (
    <>
      <PageHeader title="Health check" intro="Configuration presence only. Secret and contact values are never displayed." />
      <Container className="py-10">
        <Card><ul className="space-y-4">
          {checks.map(([label, present]) => <li key={label} className="flex justify-between gap-4">
            <span>{label}</span><strong aria-label={`${label}: ${present ? "yes" : "no"}`}>{present ? "Yes" : "No"}</strong>
          </li>)}
        </ul></Card>
      </Container>
    </>
  );
}

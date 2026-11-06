import { TranslatedText } from "@/components/i18n/LanguageProvider";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { VendorReviewConsole } from "@/components/admin/VendorReviewConsole";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vendors and affiliates", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Referral = { code: string; is_active: boolean; clicks: number; signups: number };

export default async function AdminVendors() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title={<TranslatedText value="Vendors and affiliates" />} /><Container className="py-10"><p role="alert">Database is not configured.</p></Container></>;
  }
  const [applicationsResult, codesResult, eventsResult] = await Promise.all([
    supabase.from("vendor_applications").select("id,user_id,business_name,contact_value,description,status,created_at,referral_code").order("created_at", { ascending: false }).limit(200),
    supabase.from("affiliate_codes").select("id,code,is_active"),
    supabase.from("affiliate_events").select("affiliate_code_id,event_type"),
  ]);
  const error = applicationsResult.error ?? codesResult.error ?? eventsResult.error;
  const counts = new Map<string, { clicks: number; signups: number }>();
  for (const event of eventsResult.data ?? []) {
    const count = counts.get(event.affiliate_code_id) ?? { clicks: 0, signups: 0 };
    if (event.event_type === "click") count.clicks += 1;
    if (event.event_type === "signup") count.signups += 1;
    counts.set(event.affiliate_code_id, count);
  }
  const referrals: Map<string, Referral> = new Map((codesResult.data ?? []).map((code) => {
    const count = counts.get(code.id) ?? { clicks: 0, signups: 0 };
    return [code.code, { code: code.code, is_active: code.is_active, ...count }];
  }));
  return (
    <>
      <PageHeader title={<TranslatedText value="Vendors and affiliates" />} intro={<TranslatedText value="Review applications and inspect referral events. No commissions or payouts are calculated." />} />
      <Container className="py-10">
        {error
          ? <p role="alert" className="text-red-300">Vendor and referral data are unavailable. Review the vendor and affiliates SQL proposal before enabling these tools.</p>
          : <VendorReviewConsole applications={applicationsResult.data ?? []} referrals={referrals} />}
      </Container>
    </>
  );
}

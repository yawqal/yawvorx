import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { MarketplaceSettingsForm } from "@/components/admin/MarketplaceSettingsForm";

export const metadata: Metadata = { title: "Marketplace settings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminMarketplaceSettings() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Marketplace settings" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }
  const { data, error } = await supabase.from("marketplace_settings")
    .select("vendor_commission_pct,affiliate_commission_pct,payable_after_days,referral_cookie_days,min_payout_etb")
    .eq("id", true).maybeSingle();

  return (
    <>
      <PageHeader title="Marketplace settings" intro="Configure vendor and affiliate commissions, referral duration, and payout minimum." />
      <Container className="py-10">
        {error
          ? <p role="alert" className="text-red-300">Marketplace settings could not be loaded: {error.message}</p>
          : data
            ? <MarketplaceSettingsForm settings={data} />
            : <p role="alert" className="text-red-300">The marketplace settings row (id = true) was not found.</p>}
      </Container>
    </>
  );
}

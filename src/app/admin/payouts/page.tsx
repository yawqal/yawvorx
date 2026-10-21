import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { PayoutConsole } from "@/components/admin/PayoutConsole";

export const metadata: Metadata = { title: "Payouts and earnings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Payouts and earnings" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  const [balancesResult, settingsResult, profilesResult, applicationsResult, payoutsResult, ledgerResult] = await Promise.all([
    supabase.from("earnings_balances").select("user_id,currency,pending,payable,paid_out,due").order("currency").order("user_id"),
    supabase.from("marketplace_settings").select("min_payout_etb").eq("id", true).maybeSingle(),
    supabase.from("vendor_profiles").select("user_id,display_name"),
    supabase.from("vendor_applications").select("user_id,business_name"),
    supabase.from("payouts").select("id,beneficiary_user_id,currency,amount,method,reference,note,paid_at")
      .order("paid_at", { ascending: false }).limit(50),
    supabase.from("earnings_ledger").select("id,beneficiary_user_id,beneficiary_type,entry_type,order_id,order_item_id,currency,base_amount,rate_pct,amount,payable_at,created_at")
      .order("created_at", { ascending: false }).limit(100),
  ]);
  const errors = [balancesResult.error, settingsResult.error, profilesResult.error, applicationsResult.error, payoutsResult.error, ledgerResult.error]
    .filter(Boolean).map((error) => error?.message);
  const names = new Map<string, string>();
  for (const application of applicationsResult.data ?? []) {
    if (application.business_name) names.set(application.user_id, application.business_name);
  }
  for (const profile of profilesResult.data ?? []) {
    if (profile.display_name) names.set(profile.user_id, profile.display_name);
  }
  const label = (userId: string) => names.get(userId) ?? userId;
  const balances = (balancesResult.data ?? []).map((balance) => ({ ...balance, name: label(balance.user_id) }));
  const payouts = (payoutsResult.data ?? []).map((payout) => ({ ...payout, name: label(payout.beneficiary_user_id) }));
  const ledger = (ledgerResult.data ?? []).map((entry) => ({ ...entry, name: label(entry.beneficiary_user_id) }));

  return (
    <>
      <PageHeader title="Payouts and earnings" intro="Review earnings balances, record bank payouts, and synchronize the ledger." />
      <Container className="py-10">
        {errors.length > 0
          ? <p role="alert" className="mb-6 text-red-300">Some earnings data could not be loaded: {errors.join("; ")}</p>
          : <PayoutConsole balances={balances} minPayoutEtb={settingsResult.data?.min_payout_etb ?? null} payouts={payouts} ledger={ledger} />}
      </Container>
    </>
  );
}

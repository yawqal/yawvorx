import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "My earnings", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const money = (amount: number | string, currency: string) => `${currency} ${Number(amount).toFixed(2)}`;

export default async function AccountEarningsPage() {
  const user = await requireUser("/account/earnings");
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="My earnings" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  const [balancesResult, ledgerResult, payoutsResult] = await Promise.all([
    supabase.from("earnings_balances").select("currency,pending,payable,paid_out,due").eq("user_id", user.id).order("currency"),
    supabase.from("earnings_ledger").select("created_at,beneficiary_type,entry_type,amount,currency,payable_at")
      .eq("beneficiary_user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("payouts").select("paid_at,amount,currency,method,reference")
      .eq("beneficiary_user_id", user.id).order("paid_at", { ascending: false }).limit(50),
  ]);
  const errors = [balancesResult.error, ledgerResult.error, payoutsResult.error].filter(Boolean).map((error) => error?.message);
  if (errors.length) {
    return <><PageHeader title="My earnings" /><Container className="py-10"><p role="alert" className="text-red-300">Earnings could not be loaded: {errors.join("; ")}</p></Container></>;
  }

  const balances = balancesResult.data ?? [];
  const ledger = ledgerResult.data ?? [];
  const payouts = payoutsResult.data ?? [];
  const empty = balances.length === 0 && ledger.length === 0 && payouts.length === 0;
  return (
    <>
      <PageHeader title="My earnings" intro="Review your commissions, payable balance, and payout history." />
      <Container className="space-y-8 py-10">
        <Card><p className="text-sm text-ink-mute">Pending = not yet payable during the return window. Payable = can be paid. Due = payable minus already paid.</p></Card>
        {empty ? <Card><p className="text-ink-mute">No earnings yet</p></Card> : <>
          <section>
            <h2 className="mb-3 text-xl font-semibold">Balances</h2>
            {balances.length === 0 ? <Card><p className="text-ink-mute">No earnings yet</p></Card> : <div className="space-y-3">
              {balances.map((balance) => <Card key={balance.currency}>
                <h3 className="font-semibold">{balance.currency}</h3>
                <div className="mt-2 grid gap-2 text-sm sm:grid-cols-4">
                  <p>Pending: {money(balance.pending, balance.currency)}</p>
                  <p>Payable: {money(balance.payable, balance.currency)}</p>
                  <p>Paid out: {money(balance.paid_out, balance.currency)}</p>
                  <p>Due: {money(balance.due, balance.currency)}</p>
                </div>
              </Card>)}
            </div>}
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold">Recent earnings</h2>
            {ledger.length === 0 ? <Card><p className="text-ink-mute">No earnings ledger entries yet.</p></Card> : <div className="space-y-3">
              {ledger.map((entry, index) => <Card key={`${entry.created_at}-${index}`}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-medium">{entry.beneficiary_type} · {entry.entry_type}</p>
                  <p>{money(entry.amount, entry.currency)}</p>
                </div>
                <p className="mt-1 text-sm text-ink-mute">Created {new Date(entry.created_at).toLocaleString()} · Payable {entry.payable_at ? new Date(entry.payable_at).toLocaleDateString() : "—"}</p>
              </Card>)}
            </div>}
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold">Recent payouts</h2>
            {payouts.length === 0 ? <Card><p className="text-ink-mute">No payouts yet.</p></Card> : <div className="space-y-3">
              {payouts.map((payout, index) => <Card key={`${payout.paid_at}-${index}`}>
                <div className="flex flex-wrap justify-between gap-2">
                  <p>{money(payout.amount, payout.currency)} · {payout.method}</p>
                  <p className="text-sm text-ink-mute">{new Date(payout.paid_at).toLocaleString()}</p>
                </div>
                {payout.reference && <p className="mt-1 text-sm text-ink-mute">Reference: {payout.reference}</p>}
              </Card>)}
            </div>}
          </section>
        </>}
      </Container>
    </>
  );
}

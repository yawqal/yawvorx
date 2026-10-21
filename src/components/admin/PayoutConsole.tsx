"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Balance = { user_id: string; name: string; currency: string; pending: number; payable: number; paid_out: number; due: number };
type Payout = { id: string; beneficiary_user_id: string; name: string; currency: string; amount: number; method: string; reference: string | null; note: string | null; paid_at: string };
type Ledger = { id: string; beneficiary_user_id: string; name: string; beneficiary_type: string; entry_type: string; order_id: string; order_item_id: string | null; currency: string; base_amount: number; rate_pct: number; amount: number; payable_at: string | null; created_at: string };
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink";
const money = (amount: number, currency: string) => `${currency} ${Number(amount).toFixed(2)}`;

export function PayoutConsole({ balances, minPayoutEtb, payouts, ledger }: {
  balances: Balance[]; minPayoutEtb: number | null; payouts: Payout[]; ledger: Ledger[];
}) {
  const router = useRouter();
  const eligible = balances.filter((row) => Number(row.due) > 0);
  const [selected, setSelected] = useState(eligible[0] ? `${eligible[0].user_id}|${eligible[0].currency}` : "");
  const selectedBalance = eligible.find((row) => `${row.user_id}|${row.currency}` === selected);
  const [amount, setAmount] = useState(selectedBalance ? String(selectedBalance.due) : "");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function post(path: string, body?: Record<string, string>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(path, {
        method: "POST",
        ...(body ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}),
      });
      const result = await response.json() as { error?: string; message?: string; count?: number };
      if (!response.ok) { setError(result.error ?? "The request failed."); return; }
      setMessage(result.message ?? (typeof result.count === "number" ? `Earnings synchronized (${result.count} entries).` : "Payout recorded."));
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function chooseBalance(key: string) {
    setSelected(key);
    const row = eligible.find((balance) => `${balance.user_id}|${balance.currency}` === key);
    setAmount(row ? String(row.due) : "");
  }

  return (
    <div className="space-y-10">
      {error && <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-red-300">{error}</p>}
      {message && <p role="status" className="text-cyan-soft">{message}</p>}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Balances</h2>
          <Button variant="secondary" disabled={busy} loading={busy} onClick={() => void post("/api/admin/earnings-sync")}>Sync earnings</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-obsidian-800 text-ink-mute"><tr>{["Beneficiary", "Currency", "Pending", "Payable", "Paid out", "Due"].map((heading) => <th className="px-3 py-2" key={heading}>{heading}</th>)}</tr></thead>
            <tbody>{balances.map((row) => {
              const due = Number(row.due);
              const highlighted = due > 0 && (row.currency !== "ETB" || minPayoutEtb === null || due >= Number(minPayoutEtb));
              return <tr className={highlighted ? "bg-cyan/10" : "border-t border-line"} key={`${row.user_id}-${row.currency}`}>
                <td className="px-3 py-2">{row.name}</td><td className="px-3 py-2">{row.currency}</td>
                <td className="px-3 py-2">{money(Number(row.pending), row.currency)}</td><td className="px-3 py-2">{money(Number(row.payable), row.currency)}</td>
                <td className="px-3 py-2">{money(Number(row.paid_out), row.currency)}</td><td className="px-3 py-2">{money(due, row.currency)}</td>
              </tr>;
            })}</tbody>
          </table>
          {balances.length === 0 && <p className="p-4 text-sm text-ink-mute">No earnings balances found.</p>}
        </div>
        {minPayoutEtb !== null && <p className="mt-2 text-sm text-ink-mute">ETB minimum payout: {money(Number(minPayoutEtb), "ETB")}.</p>}
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Record payout</h2>
        <Card>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => {
            event.preventDefault();
            const [beneficiary_user_id, currency] = selected.split("|");
            void post("/api/admin/payouts", { beneficiary_user_id, currency, amount, reference, note });
          }}>
            <label className="text-sm text-ink-mute">Beneficiary and currency<select className={inputClass} value={selected} onChange={(event) => chooseBalance(event.target.value)} required>
              {eligible.map((row) => <option key={`${row.user_id}-${row.currency}`} value={`${row.user_id}|${row.currency}`}>{row.name} · {row.currency} · due {money(Number(row.due), row.currency)}</option>)}
            </select></label>
            <label className="text-sm text-ink-mute">Amount<input className={inputClass} type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
            <label className="text-sm text-ink-mute">Bank reference<input className={inputClass} maxLength={200} value={reference} onChange={(event) => setReference(event.target.value)} /></label>
            <label className="text-sm text-ink-mute">Note<input className={inputClass} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} /></label>
            <p className="text-sm text-ink-mute sm:col-span-2">Method: bank</p>
            <Button type="submit" disabled={busy || eligible.length === 0} loading={busy}>Record payout</Button>
            {eligible.length === 0 && <p className="text-sm text-ink-mute">No balances are due for payout.</p>}
          </form>
        </Card>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent payouts</h2>
        <div className="space-y-3">{payouts.map((row) => <Card key={row.id}>
          <div className="flex flex-wrap justify-between gap-2"><p>{row.name} · {money(Number(row.amount), row.currency)} · {row.method}</p><p className="text-sm text-ink-mute">{new Date(row.paid_at).toLocaleString()}</p></div>
          {row.reference && <p className="mt-1 text-sm text-ink-mute">Reference: {row.reference}</p>}{row.note && <p className="mt-1 text-sm text-ink-mute">{row.note}</p>}
        </Card>)}{payouts.length === 0 && <Card><p className="text-ink-mute">No payouts recorded.</p></Card>}</div>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Recent earnings ledger</h2>
        <div className="space-y-3">{ledger.map((row) => <Card key={row.id}>
          <div className="flex flex-wrap justify-between gap-2"><p>{row.name} · {row.beneficiary_type} · {row.entry_type}</p><p>{money(Number(row.amount), row.currency)}</p></div>
          <p className="mt-1 text-sm text-ink-mute">Order {row.order_id} · {new Date(row.created_at).toLocaleString()} · Payable {row.payable_at ? new Date(row.payable_at).toLocaleDateString() : "—"}</p>
        </Card>)}{ledger.length === 0 && <Card><p className="text-ink-mute">No ledger entries found.</p></Card>}</div>
      </section>
    </div>
  );
}

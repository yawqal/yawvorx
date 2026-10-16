"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Tracked = {
  order_ref: string; status: string; payment_status: string; currency: string;
  subtotal: number | null; shipping_total: number; total: number; created_at: string;
  items: { name: string; variant: string | null; qty: number; unit_price: number }[];
};

const STATUS: Record<string, string> = {
  pending: "Received, waiting for review", confirmed: "Confirmed", processing: "Being prepared",
  shipped: "Shipped", completed: "Completed", cancelled: "Cancelled",
};
const PAYMENT: Record<string, string> = {
  unpaid: "Not paid yet", awaiting_review: "Payment under review", paid: "Paid", refunded: "Refunded",
};

export function TrackForm({ initialRef = "" }: { initialRef?: string }) {
  const [ref, setRef] = useState(initialRef);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [order, setOrder] = useState<Tracked | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMessage(null);
    setOrder(null);
    if (ref.trim().length < 6 || token.trim().length < 32) {
      setMessage("Enter your order reference and the full tracking code you received.");
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Tracking is not available right now. Please contact us."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("yvx_track_order", { p_order_ref: ref.trim(), p_token: token.trim() });
      if (error) { setMessage("We could not check your order right now. Please try again."); return; }
      if (!data) { setMessage("No order found. Check the reference and tracking code and try again."); return; }
      setOrder(data as Tracked);
    } catch {
      setMessage("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Order reference" name="ref" placeholder="YVX-XXXXXXXXXX" autoComplete="off" value={ref} onChange={(e) => setRef(e.target.value)} />
        <Input label="Tracking code" name="token" autoComplete="off" autoCapitalize="none" spellCheck={false} value={token} onChange={(e) => setToken(e.target.value)}
          hint="The long code shown once when you placed the order." />
        {message && <p role="alert" className="rounded-xl border border-amber-400/40 p-3 text-amber-300">{message}</p>}
        <Button type="submit" loading={busy} disabled={busy}>Track order</Button>
      </form>
      {order && (
        <Card className="h-fit space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{order.order_ref}</h2>
            <Badge>{STATUS[order.status] ?? order.status}</Badge>
            <Badge tone={order.payment_status === "paid" ? "ok" : "warn"}>{PAYMENT[order.payment_status] ?? order.payment_status}</Badge>
          </div>
          <p className="text-sm text-ink-mute">Placed {new Date(order.created_at).toLocaleString("en-US")}</p>
          <ul className="space-y-2 text-sm">
            {order.items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3">
                <span>{i.qty} × {i.name}{i.variant ? ` (${i.variant})` : ""}</span>
                <span>{formatMoney(i.qty * i.unit_price, order.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><span>Shipping</span><span>{formatMoney(order.shipping_total, order.currency)}</span></div>
            <div className="mt-1 flex justify-between"><span>Total</span><span className="font-display">{formatMoney(order.total, order.currency)}</span></div>
          </div>
        </Card>
      )}
    </div>
  );
}

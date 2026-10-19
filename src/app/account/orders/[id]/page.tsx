import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };
export const dynamic = "force-dynamic";

const statusMessage: Record<string, string> = {
  pending: "Order received and waiting for review.",
  confirmed: "Your order has been confirmed.",
  processing: "Your order is being prepared.",
  shipped: "Your order has been shipped.",
  completed: "Your order is complete.",
  cancelled: "This order was cancelled.",
};

export default async function CustomerOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${encodeURIComponent(id)}`);
  const supabase = getSupabaseServerClient();
  if (!supabase) notFound();
  const { data: order, error } = await supabase.from("orders")
    .select("id,order_ref,status,payment_status,payment_method,currency,subtotal,shipping_total,total,created_at")
    .eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error || !order) notFound();
  const { data: items, error: itemsError } = await supabase.from("order_items")
    .select("product_name,quantity,unit_price,variant_label").eq("order_id", order.id);

  return (
    <>
      <PageHeader title={order.order_ref} intro="Order details and current tracking status">
        <Badge>{order.status}</Badge>
        <Badge tone={order.payment_status === "paid" ? "ok" : "warn"}>{order.payment_status.replace(/_/g, " ")}</Badge>
      </PageHeader>
      <Container className="max-w-3xl space-y-5 py-10">
        <Card>
          <h2 className="text-lg font-semibold">Tracking</h2>
          <p className="mt-2 text-ink-mute">{statusMessage[order.status] ?? "Your order status is being updated."}</p>
          <p className="mt-2 text-sm text-ink-mute">Placed {new Date(order.created_at).toLocaleString()}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Items</h2>
          {itemsError ? <p role="alert" className="mt-2 text-red-300">Order items could not be loaded: {itemsError.message}</p> : (
            <ul className="mt-3 space-y-3">
              {(items ?? []).map((item, index) => <li key={`${item.product_name}-${index}`} className="flex justify-between gap-4 border-b border-line pb-3">
                <span>{item.quantity} × {item.product_name}{item.variant_label ? ` (${item.variant_label})` : ""}</span>
                <span>{formatMoney(Number(item.unit_price) * item.quantity, order.currency)}</span>
              </li>)}
            </ul>
          )}
          <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            {order.subtotal !== null && <p className="flex justify-between"><span>Subtotal</span><span>{formatMoney(Number(order.subtotal), order.currency)}</span></p>}
            <p className="flex justify-between"><span>Shipping</span><span>{formatMoney(Number(order.shipping_total), order.currency)}</span></p>
            <p className="flex justify-between font-semibold"><span>Total</span><span>{formatMoney(Number(order.total), order.currency)}</span></p>
          </div>
          {order.payment_method === "manual" && order.payment_status !== "paid" && <p className="mt-4 text-sm text-amber-300">Manual payment is reviewed by an administrator. No payment is considered confirmed until it is verified.</p>}
        </Card>
        <Link href="/account#orders" className="inline-block py-2 text-ink-mute underline">Back to my orders</Link>
      </Container>
    </>
  );
}

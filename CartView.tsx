"use client";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { formatMoney } from "@/lib/format";

export function CartView() {
  const { items, ready, subtotal, currency, setQty, remove } = useCart();
  if (!ready) return <LoadingState label="Loading your cart…" />;
  if (items.length === 0)
    return <EmptyState title="Your cart is empty" description="Browse the shop and add something you like." action={{ label: "Shop products", href: "/shop" }} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ul className="space-y-4">
        {items.map((i) => (
          <li key={i.key}>
            <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{i.name}</h2>
                <p className="text-sm text-ink-mute">{i.variantLabel ? `${i.variantLabel} · ` : ""}{i.type === "digital" ? "Digital" : "Physical"} · {formatMoney(i.unitPrice, i.currency)} each</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                {i.maxQty > 1 ? (
                  <div className="flex items-center gap-1" role="group" aria-label={`Quantity for ${i.name}`}>
                    <Button variant="secondary" className="!px-0 w-11" aria-label="Decrease quantity" disabled={i.qty <= 1} onClick={() => setQty(i.key, i.qty - 1)}>−</Button>
                    <span className="w-8 text-center" aria-live="polite">{i.qty}</span>
                    <Button variant="secondary" className="!px-0 w-11" aria-label="Increase quantity" disabled={i.qty >= i.maxQty} onClick={() => setQty(i.key, i.qty + 1)}>+</Button>
                  </div>
                ) : <span className="text-sm text-ink-mute">Qty 1</span>}
                <span className="w-20 text-right font-display">{formatMoney(i.qty * i.unitPrice, i.currency)}</span>
                <Button variant="ghost" onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}>Remove</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="h-fit lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Order summary</h2>
        <div className="mt-4 flex justify-between"><span className="text-ink-mute">Subtotal</span><span className="font-display">{formatMoney(subtotal, currency ?? undefined)}</span></div>
        <p className="mt-3 text-sm text-ink-mute">Shipping, if any, is confirmed when your order is reviewed. Final prices and stock are checked by our server when you place the order.</p>
        <Button href="/checkout" className="mt-5 w-full">Continue to checkout</Button>
      </Card>
    </div>
  );
}

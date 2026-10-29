"use client";
import Link from "next/link";
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
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <ul className="space-y-5">
        {items.map((i) => (
          <li key={i.key}>
            <Card interactive className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="min-w-0">
                <Link href={`/shop/${i.slug}`} className="text-lg font-semibold decoration-violet/40 underline-offset-4 hover:text-violet-soft hover:underline">{i.name}</Link>
                <p className="mt-1 text-sm text-ink-mute">{i.variantLabel ? `${i.variantLabel} · ` : ""}{i.type === "digital" ? "Digital" : "Physical"} · {formatMoney(i.unitPrice, i.currency)} each</p>
              </div>
              <div className="flex items-center justify-between gap-5 sm:justify-end">
                {i.maxQty > 1 ? (
                  <div className="flex items-center gap-2" role="group" aria-label={`Quantity for ${i.name}`}>
                    <Button variant="secondary" className="!px-0 w-14 h-14 focus-outline" aria-label="Decrease quantity" disabled={i.qty <= 1} onClick={() => setQty(i.key, i.qty - 1)}>−</Button>
                    <span className="w-9 text-center font-mono" aria-live="polite">{i.qty}</span>
                    <Button variant="secondary" className="!px-0 w-14 h-14 focus-outline" aria-label="Increase quantity" disabled={i.qty >= i.maxQty} onClick={() => setQty(i.key, i.qty + 1)}>+</Button>
                  </div>
                ) : <span className="text-sm text-ink-mute">Qty 1</span>}
                <span className="w-24 text-right font-display">{formatMoney(i.qty * i.unitPrice, i.currency)}</span>
                <Button variant="ghost" onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}>Remove</Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="h-fit bg-gradient-to-b from-white to-obsidian-800 lg:sticky lg:top-24">
        <p className="eyebrow">Your selection</p><h2 className="mt-3 text-xl font-semibold">Order summary</h2>
        <div className="mt-8 flex justify-between border-t border-line pt-5"><span className="text-ink-mute">Subtotal</span><span className="font-display text-lg font-semibold">{formatMoney(subtotal, currency ?? undefined)}</span></div>
        <p className="mt-5 text-sm leading-relaxed text-ink-mute">Shipping, if any, is confirmed when your order is reviewed. Final prices and stock are checked by our server when you place the order.</p>
        <Button href="/checkout" className="mt-8 w-full">Continue to checkout</Button>
      </Card>
    </div>
  );
}

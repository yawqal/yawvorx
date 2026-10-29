"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";
import { availability, type Product } from "@/data/products";
import { useCurrency } from "@/components/i18n/CurrencyProvider";
import { priceFor } from "@/lib/pricing";

export function AddToCart({ product }: { product: Product }) {
  const { add, items } = useCart();
  const { currency } = useCurrency();
  const a = availability(product);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = product.variants?.find((v) => v.id === variantId);
  const unit = priceFor(product, currency, variant?.priceDelta ?? 0);
  const maxQty = product.type === "digital" ? 1 : Math.max(1, Math.min(product.stock ?? 1, 10));
  // One order can use one currency only.
  const otherCurrency = items.length > 0 && items[0].currency !== currency ? items[0].currency : null;

  if (!a.ok) return <p className="rounded-xl border border-red-400/40 p-4 text-red-300" role="status">This product is currently unavailable.</p>;

  return (
    <div className="space-y-4">
      {unit === null
        ? <p role="status" className="text-sm text-amber-300">Not available in {currency}</p>
        : <p className="font-display text-3xl">{formatMoney(unit, currency)}</p>}
      {product.variants && (
        <Select label="Option" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
          {product.variants.map((v) => <option key={v.id} value={v.id}>{v.label}{v.priceDelta ? ` (+${formatMoney(v.priceDelta, currency)})` : ""}</option>)}
        </Select>
      )}
      {maxQty > 1 && (
        <Input label="Quantity" type="number" inputMode="numeric" min={1} max={maxQty} value={qty}
          hint={`Up to ${maxQty}`} onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Math.floor(Number(e.target.value)) || 1)))} />
      )}
      {otherCurrency && (
        <p role="status" className="text-sm text-amber-300">
          Your cart already has items priced in {otherCurrency}. One order can use one currency only, so please finish that order first or <Link href="/cart" className="underline">review your cart</Link>.
        </p>
      )}
      <Button className="w-full sm:w-auto focus-outline" disabled={!!otherCurrency || unit === null} onClick={() => {
        if (unit === null) return;
        add({ key: `${product.slug}:${variantId}`, slug: product.slug, name: product.name, variantId: variantId || undefined, variantLabel: variant?.label, unitPrice: unit, type: product.type, maxQty, currency }, qty);
        setAdded(true);
      }}>Add to cart</Button>
      {added && <p role="status" className="text-cyan-soft">Added to cart. <Link href="/cart" className="underline">View cart</Link></p>}
    </div>
  );
}
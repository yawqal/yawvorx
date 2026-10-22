"use client";

import { useCurrency } from "@/components/i18n/CurrencyProvider";
import type { Product } from "@/data/products";
import { formatMoney } from "@/lib/format";

export function ProductPrice({ product, className = "" }: {
  product: Pick<Product, "price" | "currency" | "priceETB" | "priceUSD">;
  className?: string;
}) {
  const { currency } = useCurrency();
  const selectedPrice = currency === "ETB" ? product.priceETB : product.priceUSD;
  const amount = typeof selectedPrice === "number" ? selectedPrice : product.price;
  const priceCurrency = typeof selectedPrice === "number" ? currency : product.currency;

  return <span className={className}>{formatMoney(amount, priceCurrency)}</span>;
}

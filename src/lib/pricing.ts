import type { Currency, Product } from "@/data/products";

export function priceFor(product: Product, currency: Currency, variantDelta = 0): number | null {
  if (variantDelta !== 0 && currency !== product.currency) return null;
  const base = product.priceETB !== undefined && product.priceUSD !== undefined
    ? currency === "ETB" ? product.priceETB : product.priceUSD
    : currency === product.currency ? product.price : null;
  if (base === null) return null;
  return Math.round((base + variantDelta) * 100) / 100;
}

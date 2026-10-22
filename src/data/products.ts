// Product types and helpers. Real products now come from the database: see src/lib/products-db.ts
export type Currency = "ETB" | "USD";
export type Variant = { id: string; label: string; priceDelta?: number };
export type Product = {
  id?: string; slug: string; name: string; description: string; price: number; currency: Currency; category: string;
  image_url?: string | null;
  priceETB?: number; priceUSD?: number;
  type: "digital" | "physical"; stock?: number; variants?: Variant[]; isDemo?: boolean;
};

export function availability(p: Product): { label: string; ok: boolean } {
  if (p.type === "digital") return { label: "Digital product", ok: true };
  const s = p.stock ?? 0;
  if (s <= 0) return { label: "Out of stock", ok: false };
  return { label: s <= 5 ? `Only ${s} left` : "In stock", ok: true };
}

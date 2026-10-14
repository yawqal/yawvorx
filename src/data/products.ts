// DEMONSTRATION PRODUCTS ONLY. Prices and stock are examples. Phase 4/5 replaces this with real database products.
export type Variant = { id: string; label: string; priceDelta?: number };
export type Product = {
  slug: string; name: string; description: string; price: number; category: string;
  type: "digital" | "physical"; stock?: number; variants?: Variant[];
};

export const products: Product[] = [
  { slug: "demo-brand-starter-kit", name: "Brand Starter Kit", description: "Demonstration digital product listing. Replace with your real file bundle.", price: 19, category: "Digital templates", type: "digital" },
  { slug: "demo-social-template-pack", name: "Social Template Pack", description: "Demonstration digital product listing for editable social media templates.", price: 12, category: "Digital templates", type: "digital" },
  { slug: "demo-photo-preset-pack", name: "Photo Preset Pack", description: "Demonstration digital product listing for photo editing presets.", price: 9, category: "Digital presets", type: "digital" },
  { slug: "demo-notebook", name: "Studio Notebook", description: "Demonstration physical product listing.", price: 14, category: "Stationery", type: "physical", stock: 12, variants: [{ id: "black", label: "Black" }, { id: "violet", label: "Violet" }] },
  { slug: "demo-desk-mat", name: "Desk Mat", description: "Demonstration physical product listing with size options.", price: 22, category: "Accessories", type: "physical", stock: 4, variants: [{ id: "s", label: "Small" }, { id: "l", label: "Large", priceDelta: 8 }] },
  { slug: "demo-sticker-pack", name: "Sticker Pack", description: "Demonstration physical product that is out of stock, to show that state.", price: 6, category: "Stationery", type: "physical", stock: 0 },
];

export const productCategories = Array.from(new Set(products.map((p) => p.category)));
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export function availability(p: Product): { label: string; ok: boolean } {
  if (p.type === "digital") return { label: "Digital product", ok: true };
  const s = p.stock ?? 0;
  if (s <= 0) return { label: "Out of stock", ok: false };
  return { label: s <= 5 ? `Only ${s} left` : "In stock", ok: true };
}

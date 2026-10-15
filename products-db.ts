import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Currency, Product, Variant } from "@/data/products";

type CategoryRef = { name: string } | { name: string }[] | null;
type ProductRow = {
  id: string; slug: string; name: string; description: string | null; price: number | string;
  currency: string; stock: number | null; product_type: string; is_demo: boolean | null; categories: CategoryRef;
};
type VariantRow = { id: string; product_id: string; label: string; price_delta: number | string; stock: number | null };

const num = (n: number | string | null | undefined): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

function categoryName(c: CategoryRef): string {
  const first = Array.isArray(c) ? c[0] : c;
  return first?.name || "General";
}

/** Reads published products (and their active options) from the database. Returns [] if anything goes wrong. */
async function load(slug?: string): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  let query = supabase
    .from("products")
    .select("id, slug, name, description, price, currency, stock, product_type, is_demo, categories(name)")
    .eq("is_published", true);
  if (slug) query = query.eq("slug", slug);
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error || !data) return [];

  const rows = data as unknown as ProductRow[];
  if (rows.length === 0) return [];

  const { data: vdata } = await supabase
    .from("product_variants")
    .select("id, product_id, label, price_delta, stock")
    .eq("is_active", true)
    .in("product_id", rows.map((r) => r.id))
    .order("sort_order", { ascending: true });
  const variantRows = (vdata ?? []) as unknown as VariantRow[];

  return rows.map((r): Product => {
    const mine = variantRows.filter((v) => v.product_id === r.id);
    const variants: Variant[] = mine.map((v) => ({ id: v.id, label: v.label, priceDelta: num(v.price_delta) || undefined }));
    const variantStocks = mine.map((v) => v.stock).filter((s): s is number => typeof s === "number");
    const stock = variantStocks.length > 0 ? variantStocks.reduce((a, b) => a + b, 0) : (r.stock ?? 0);
    const currency: Currency = r.currency === "ETB" ? "ETB" : "USD";
    return {
      slug: r.slug,
      name: r.name,
      description: r.description ?? "",
      price: num(r.price),
      currency,
      category: categoryName(r.categories),
      type: r.product_type === "digital" ? "digital" : "physical",
      stock,
      variants: variants.length > 0 ? variants : undefined,
      isDemo: !!r.is_demo,
    };
  });
}

export const getProducts = (): Promise<Product[]> => load();
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await load(slug))[0];
}

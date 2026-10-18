import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Currency, Product, Variant } from "@/data/products";

type CategoryRef = { name: string } | { name: string }[] | null;
type ProductRow = {
  id: string; slug: string; name: string; description: string | null; price: number | string;
  currency: string; stock: number | null; product_type: string; is_demo: boolean | null;
  category_id: number | null; price_etb?: number | string | null; price_usd?: number | string | null; categories: CategoryRef;
};
type VariantRow = { id: string; product_id: string; label: string; price_delta: number | string; stock: number | null };
export type ProductCategory = { id: number; name: string; slug: string };

export function isMissingDualPriceColumns(error: { message: string } | null): boolean {
  const message = error?.message.toLowerCase() ?? "";
  return /price_etb|price_usd/.test(message) && /column|schema cache|does not exist|could not find/.test(message);
}

const num = (n: number | string | null | undefined): number => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

function categoryName(c: CategoryRef): string {
  const first = Array.isArray(c) ? c[0] : c;
  return first?.name || "General";
}

/** Reads published products (and their active options) from the database. Returns [] if anything goes wrong. */
async function load(slug?: string, filters: { search?: string; categoryId?: string } = {}): Promise<Product[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const search = filters.search?.trim().slice(0, 80).replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim() ?? "";
  const categoryId = filters.categoryId && /^[1-9]\d{0,14}$/.test(filters.categoryId)
    ? Number(filters.categoryId)
    : null;
  const queryProducts = (columns: string) => {
    let query = supabase
    .from("products")
    .select(columns)
    .eq("is_published", true);
    if (slug) query = query.eq("slug", slug);
    if (categoryId !== null && Number.isSafeInteger(categoryId)) query = query.eq("category_id", categoryId);
    if (search) query = query.ilike("name", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
    return query.order("created_at", { ascending: true });
  };
  let result = await queryProducts("id, slug, name, description, price, currency, stock, product_type, is_demo, category_id, price_etb, price_usd, categories(name)");
  if (isMissingDualPriceColumns(result.error)) {
    result = await queryProducts("id, slug, name, description, price, currency, stock, product_type, is_demo, category_id, categories(name)");
  }
  if (result.error || !result.data) {
    if (result.error) console.error("Could not load published products:", result.error.message);
    return [];
  }

  const rows = result.data as unknown as ProductRow[];
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
    const priceETB = r.price_etb == null ? null : Number(r.price_etb);
    const priceUSD = r.price_usd == null ? null : Number(r.price_usd);
    const hasDualPrices = priceETB !== null && Number.isFinite(priceETB) && priceETB >= 0 &&
      priceUSD !== null && Number.isFinite(priceUSD) && priceUSD >= 0;
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description ?? "",
      price: num(r.price),
      currency,
      ...(hasDualPrices ? { priceETB, priceUSD } : {}),
      category: categoryName(r.categories),
      type: r.product_type === "digital" ? "digital" : "physical",
      stock,
      variants: variants.length > 0 ? variants : undefined,
      isDemo: !!r.is_demo,
    };
  });
}

export const getProducts = (filters: { search?: string; categoryId?: string } = {}): Promise<Product[]> => load(undefined, filters);
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await load(slug))[0];
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("categories").select("id,name,slug").order("name");
  if (error) {
    console.error("Could not load product categories:", error.message);
    return [];
  }
  return data ?? [];
}

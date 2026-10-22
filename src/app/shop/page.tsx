import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { getProductCategories, getProducts } from "@/lib/products-db";
import { TranslatedText } from "@/components/i18n/LanguageProvider";
import { canonicalUrl } from "@/lib/seo";

export const metadata: Metadata = { title: "Shop", description: "Digital and physical products from YAWVOREX.", alternates: { canonical: canonicalUrl("/shop") } };
export const dynamic = "force-dynamic";

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const resolvedSearchParams = await searchParams;
  const search = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.slice(0, 80) : "";
  const category = typeof resolvedSearchParams.category === "string" && /^[1-9]\d{0,14}$/.test(resolvedSearchParams.category)
    ? resolvedSearchParams.category
    : "";
  const [products, categories] = await Promise.all([
    getProducts({ search, categoryId: category }),
    getProductCategories(),
  ]);
  return (
    <div className="min-h-[70vh]">
      <div className="border-b border-line bg-aurora">
        <Container className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan">The collection</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl"><TranslatedText value="Shop" /></h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-mute sm:text-lg"><TranslatedText value="Digital and physical products from YAWVOREX. Orders are confirmed by YAWVOREX before processing." /></p>
          </div>
          <div className="flex items-center gap-3">
            {products.some((p) => p.isDemo) && <Badge tone="demo">Demo catalog</Badge>}
            <span className="text-sm text-ink-mute">{products.length} listed items</span>
          </div>
        </Container>
      </div>
      <Container className="py-9 sm:py-12">
        <ShopBrowser products={products} categories={categories} search={search} selectedCategory={category} />
      </Container>
    </div>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
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
    <>
      <PageHeader title={<TranslatedText value="Shop" />} intro={<TranslatedText value="Digital and physical products from YAWVOREX. Orders are confirmed by YAWVOREX before processing." />}>
        {products.some((p) => p.isDemo) && <Badge tone="demo">Demo catalog</Badge>}
      </PageHeader>
      <Section title={<TranslatedText value="Products" />}><ShopBrowser products={products} categories={categories} search={search} selectedCategory={category} /></Section>
    </>
  );
}

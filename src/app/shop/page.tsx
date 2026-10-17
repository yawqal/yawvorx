import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { getProductCategories, getProducts } from "@/lib/products-db";

export const metadata: Metadata = { title: "Shop", description: "Digital and physical products from YAWVOREX." };
export const dynamic = "force-dynamic";

export default async function Shop({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const search = typeof searchParams.q === "string" ? searchParams.q.slice(0, 80) : "";
  const category = typeof searchParams.category === "string" && /^[1-9]\d{0,14}$/.test(searchParams.category)
    ? searchParams.category
    : "";
  const [products, categories] = await Promise.all([
    getProducts({ search, categoryId: category }),
    getProductCategories(),
  ]);
  return (
    <>
      <PageHeader title="Shop" intro="Digital and physical products. Orders are confirmed by YAWVOREX before processing.">
        {products.some((p) => p.isDemo) && <Badge tone="demo">Demo catalog</Badge>}
      </PageHeader>
      <Section title="Products"><ShopBrowser products={products} categories={categories} search={search} selectedCategory={category} /></Section>
    </>
  );
}

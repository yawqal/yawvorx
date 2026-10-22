"use client";
import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { ProductCard } from "@/components/cards/Cards";
import type { Product } from "@/data/products";
import type { ProductCategory } from "@/lib/products-db";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export function ShopBrowser({ products, categories, search, selectedCategory }: {
  products: Product[]; categories: ProductCategory[]; search: string; selectedCategory: string;
}) {
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("featured");
  const { t } = useLanguage();

  const shown = useMemo(() => {
    const list = products.filter((p) =>
      type === "all" || p.type === type);
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, type, sort]);

  if (products.length === 0)
    return <EmptyState title="The shop is getting ready" description="Owner: add your first product from the admin panel once it is available (Phase 6)." />;

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12">
      <aside className="h-fit lg:sticky lg:top-24">
        <div className="border-b border-line pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-soft">Find your next</p>
          <h2 className="mt-2 text-xl font-semibold">{t("Refine selection")}</h2>
        </div>
        <form method="get" action="/shop" className="grid gap-4 py-5">
          <Input label={t("Search")} name="q" type="search" maxLength={80} placeholder={t("Search products")} defaultValue={search} />
          <Select label={t("Category")} name="category" defaultValue={selectedCategory}>
            <option value="">{t("All categories")}</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select label={t("Type")} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">{t("Digital and physical")}</option><option value="digital">{t("Digital")}</option><option value="physical">{t("Physical")}</option>
          </Select>
          <Select label={t("Sort by")} value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="featured">{t("Featured")}</option><option value="price-asc">{t("Price: low to high")}</option>
            <option value="price-desc">{t("Price: high to low")}</option><option value="name">{t("Name")}</option>
          </Select>
          <Button type="submit" variant="secondary" className="w-full">{t("Search products")}</Button>
        </form>
      </aside>
      <section aria-label="Product results">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
          <div><p className="text-xs uppercase tracking-[0.18em] text-ink-mute">Catalog</p><h2 className="mt-1 text-2xl font-semibold">{t("Products")}</h2></div>
          <p className="text-sm text-ink-mute" role="status">{shown.length} {t(shown.length === 1 ? "product" : "products")}</p>
        </div>
        {shown.length === 0
          ? <div className="mt-6"><EmptyState title="No matching products" description="Try a different search or clear the filters." /></div>
          : <div className="mt-6 grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
      </section>
    </div>
  );
}

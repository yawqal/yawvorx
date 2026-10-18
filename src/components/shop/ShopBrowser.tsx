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
    <div>
      <form method="get" action="/shop" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        <Button type="submit" variant="secondary" className="sm:col-span-2 lg:col-span-4">{t("Search products")}</Button>
      </form>
      <p className="mt-4 text-sm text-ink-mute" role="status">{shown.length} {t(shown.length === 1 ? "product" : "products")}</p>
      {shown.length === 0
        ? <div className="mt-6"><EmptyState title="No matching products" description="Try a different search or clear the filters." /></div>
        : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
    </div>
  );
}

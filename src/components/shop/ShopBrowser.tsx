"use client";
import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { ProductCard } from "@/components/cards/Cards";
import type { Product } from "@/data/products";
import type { ProductCategory } from "@/lib/products-db";
import { Button } from "@/components/ui/Button";

export function ShopBrowser({ products, categories, search, selectedCategory }: {
  products: Product[]; categories: ProductCategory[]; search: string; selectedCategory: string;
}) {
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("featured");

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
        <Input label="Search" name="q" type="search" maxLength={80} placeholder="Search products" defaultValue={search} />
        <Select label="Category" name="category" defaultValue={selectedCategory}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Digital and physical</option><option value="digital">Digital</option><option value="physical">Physical</option>
        </Select>
        <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option><option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option><option value="name">Name</option>
        </Select>
        <Button type="submit" variant="secondary" className="sm:col-span-2 lg:col-span-4">Search products</Button>
      </form>
      <p className="mt-4 text-sm text-ink-mute" role="status">{shown.length} product{shown.length === 1 ? "" : "s"}</p>
      {shown.length === 0
        ? <div className="mt-6"><EmptyState title="No matching products" description="Try a different search or clear the filters." /></div>
        : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
    </div>
  );
}

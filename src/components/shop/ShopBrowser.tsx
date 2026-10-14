"use client";
import { useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/States";
import { ProductCard } from "@/components/cards/Cards";
import type { Product } from "@/data/products";

export function ShopBrowser({ products }: { products: Product[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("featured");

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category))), [products]);
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = products.filter((p) =>
      (category === "all" || p.category === category) && (type === "all" || p.type === type) &&
      (!term || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(term)));
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [products, q, category, type, sort]);

  if (products.length === 0)
    return <EmptyState title="The shop is getting ready" description="Owner: add your first product from the admin panel once it is available (Phase 6)." />;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input label="Search" type="search" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>{categories.map((c) => <option key={c}>{c}</option>)}
        </Select>
        <Select label="Type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Digital and physical</option><option value="digital">Digital</option><option value="physical">Physical</option>
        </Select>
        <Select label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured</option><option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option><option value="name">Name</option>
        </Select>
      </div>
      <p className="mt-4 text-sm text-ink-mute" role="status">{shown.length} product{shown.length === 1 ? "" : "s"}</p>
      {shown.length === 0
        ? <div className="mt-6"><EmptyState title="No matching products" description="Try a different search or clear the filters." /></div>
        : <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{shown.map((p) => <ProductCard key={p.slug} p={p} />)}</div>}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/cards/Cards";
import { canonicalUrl } from "@/lib/seo";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getApprovedVendorProducts } from "@/lib/products-db";
import type { Product } from "@/data/products";

type Props = { params: Promise<{ id: string }> };
async function getStore(id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { store: null, error: "Database is not configured." };
  const result = await supabase.from("public_vendor_stores").select("id,display_name").eq("id", id).maybeSingle();
  return { store: result.data, error: result.error?.message ?? null };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { store } = await getStore(id);
  return store ? { title: store.display_name, description: `Products from ${store.display_name}.`, alternates: { canonical: canonicalUrl(`/vendors/${encodeURIComponent(store.id)}`) } } : { title: "Vendor store", robots: { index: false, follow: false } };
}
export default async function VendorStorePage({ params }: Props) {
  const { id } = await params;
  const [{ store, error }, products] = await Promise.all([getStore(id), getApprovedVendorProducts(id)]);
  if (!store && !error) notFound();
  return <>
    <PageHeader title={store?.display_name ?? "Vendor store"} intro="Approved published products from this public store." />
    <Container className="py-8 sm:py-10">
      {error ? <p role="alert" className="mb-6 text-red-300">Vendor store could not be loaded: {error}</p> : null}
      {!error && products.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{products.map((product) => <ProductCard key={product.slug} p={product as Product} />)}</div>
        : !error && <Card><h2 className="font-semibold">No products yet</h2><p className="mt-2 text-ink-mute">This vendor has no approved published products yet.</p></Card>}
    </Container>
  </>;
}

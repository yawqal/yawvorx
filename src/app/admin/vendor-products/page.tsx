import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { VendorProductsReview } from "@/components/admin/VendorProductsReview";

export const metadata: Metadata = { title: "Vendor products", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminVendorProducts() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }
  const productsResult = await supabase.from("products")
    .select("id,vendor_id,name,slug,price_etb,price_usd,stock,approval_status,created_at")
    .not("vendor_id", "is", null).order("created_at", { ascending: false });
  if (productsResult.error) {
    return <><PageHeader title="Vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Vendor products could not be loaded: {productsResult.error.message}</p></Container></>;
  }

  const products = productsResult.data ?? [];
  const vendorIds = [...new Set(products.map((product) => product.vendor_id).filter((id): id is string => id !== null))];
  const vendorsResult = vendorIds.length
    ? await supabase.from("vendor_profiles").select("user_id,display_name").in("user_id", vendorIds)
    : { data: [], error: null };
  if (vendorsResult.error) {
    return <><PageHeader title="Vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Vendor names could not be loaded: {vendorsResult.error.message}</p></Container></>;
  }
  const vendorNames = new Map((vendorsResult.data ?? []).map((vendor) => [vendor.user_id, vendor.display_name]));
  const rows = products.map((product) => ({ ...product, vendor_name: vendorNames.get(product.vendor_id) ?? "Unknown vendor" }))
    .sort((a, b) => Number(b.approval_status === "pending") - Number(a.approval_status === "pending") ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <>
      <PageHeader title="Vendor products" intro="Approve or reject vendor-submitted products. Approval does not publish a product." />
      <Container className="py-10"><VendorProductsReview products={rows} /></Container>
    </>
  );
}

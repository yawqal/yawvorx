import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VendorProductManager } from "@/components/vendor/VendorProductManager";

export const metadata: Metadata = { title: "My vendor products", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VendorProductsPage() {
  const user = await requireUser("/vendor/products");
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="My vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }
  const { data: vendor, error: vendorError } = await supabase.from("vendor_profiles")
    .select("status").eq("user_id", user.id).maybeSingle();
  if (vendorError) {
    return <><PageHeader title="My vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Vendor account status could not be loaded: {vendorError.message}</p></Container></>;
  }
  if (!vendor || vendor.status !== "active") {
    return <>
      <PageHeader title="My vendor products" />
      <Container className="py-10"><Card>
        <p>Your vendor account is not active</p>
        <Link href="/account" className="mt-3 inline-block text-secondary-soft underline">Go to your account and vendor application</Link>
      </Card></Container>
    </>;
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("id,name,slug,description,price,currency,price_etb,price_usd,stock,category_id,image_url,approval_status,created_at")
      .eq("vendor_id", user.id).order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name").order("name"),
  ]);
  if (productsResult.error || categoriesResult.error) {
    const message = [productsResult.error?.message, categoriesResult.error?.message].filter(Boolean).join("; ");
    return <><PageHeader title="My vendor products" /><Container className="py-10"><p role="alert" className="text-red-300">Vendor products could not be loaded: {message}</p></Container></>;
  }

  return (
    <>
      <PageHeader title="My vendor products" intro="Create and submit products for admin review. Approved products are published by an admin." />
      <Container className="py-10">
        <VendorProductManager vendorUserId={user.id} products={productsResult.data ?? []} categories={categoriesResult.data ?? []} />
      </Container>
    </>
  );
}

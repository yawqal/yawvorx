import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"];

export default async function Admin() {
  const user = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Admin area"><Badge tone="ok">Admin verified</Badge></PageHeader><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  const [
    productsResult, categoriesResult, variantsResult, ordersResult, ...countResults
  ] = await Promise.all([
    supabase.from("products").select("id,name,slug,description,price,currency,stock,image_url,category_id,product_type,is_demo,is_published").order("created_at", { ascending: false }).limit(200),
    supabase.from("categories").select("id,name,slug").order("name"),
    supabase.from("product_variants").select("id,product_id,label,stock").order("sort_order"),
    supabase.from("orders").select("id,order_ref,customer_name,customer_email,status,payment_status,currency,total,created_at,payment_method").order("created_at", { ascending: false }).limit(100),
    ...ORDER_STATUSES.map((status) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)),
  ]);

  const orderIds = (ordersResult.data ?? []).map((order) => order.id);
  const itemsResult = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_name,quantity,unit_price,variant_label").in("order_id", orderIds)
    : { data: [], error: null };
  const items = new Map<string, { product_name: string; quantity: number; unit_price: number; variant_label: string | null }[]>();
  for (const item of itemsResult.data ?? []) {
    const current = items.get(item.order_id) ?? [];
    current.push(item);
    items.set(item.order_id, current);
  }
  const counts = Object.fromEntries(ORDER_STATUSES.map((status, index) => [status, countResults[index].count ?? 0]));
  const errors = [
    productsResult.error, categoriesResult.error, variantsResult.error, ordersResult.error, itemsResult.error,
    ...countResults.map((result) => result.error),
  ].filter(Boolean).map((error) => error?.message);

  return (
    <>
      <PageHeader title="Admin area" intro={`Signed in as ${user.email ?? "admin"}`}>
        <Badge tone="ok">Admin verified by the database</Badge>
      </PageHeader>
      <Container className="py-10">
        <AdminConsole
          products={productsResult.data ?? []}
          categories={categoriesResult.data ?? []}
          variants={variantsResult.data ?? []}
          orders={(ordersResult.data ?? []).map((order) => ({ ...order, items: items.get(order.id) ?? [] }))}
          counts={counts}
          loadError={errors.length ? `Some admin data could not be loaded: ${errors.join("; ")}` : undefined}
        />
      </Container>
    </>
  );
}

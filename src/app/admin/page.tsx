import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { AdminConsole } from "@/components/admin/AdminConsole";
import { ContentManagement } from "@/components/admin/ContentManagement";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { isMissingDualPriceColumns } from "@/lib/products-db";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"];

export default async function Admin() {
  const user = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Admin area"><Badge tone="ok">Admin verified</Badge></PageHeader><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  const dualProductsResult = await supabase.from("products")
    .select("id,name,slug,description,price,price_etb,price_usd,currency,stock,image_url,category_id,product_type,is_demo,is_published")
    .order("created_at", { ascending: false }).limit(200);
  const missingDualPriceColumns = isMissingDualPriceColumns(dualProductsResult.error);
  const dualPricingAvailable = dualProductsResult.error === null;
  const productsResult = !missingDualPriceColumns ? dualProductsResult : await supabase.from("products")
      .select("id,name,slug,description,price,currency,stock,image_url,category_id,product_type,is_demo,is_published")
      .order("created_at", { ascending: false }).limit(200);
  const [
    categoriesResult, variantsResult, digitalFilesResult, ordersResult,
    servicesResult, projectsResult, requestsResult, ticketsResult, ...countResults
  ] = await Promise.all([
    supabase.from("categories").select("id,name,slug").order("name"),
    supabase.from("product_variants").select("id,product_id,label,stock").order("sort_order"),
    supabase.from("digital_files").select("id,product_id,variant_id,storage_path,file_name").order("created_at"),
    supabase.from("orders").select("id,order_ref,customer_name,customer_email,status,payment_status,currency,total,created_at,payment_method").order("created_at", { ascending: false }).limit(100),
    supabase.from("services").select("id,slug,title,description,deliverables,is_published").order("created_at", { ascending: false }),
    supabase.from("portfolio_projects").select("id,slug,title,category,summary,brief,approach,deliverables,tags,live_url,cover_image_path,is_demo,is_published").order("created_at", { ascending: false }),
    supabase.from("service_requests").select("id,customer_name,customer_email,service_type,details,status,created_at,contact_method,contact_value").order("created_at", { ascending: false }).limit(100),
    supabase.from("support_tickets").select("id,user_id,subject,status,created_at").order("updated_at", { ascending: false }).limit(100),
    ...ORDER_STATUSES.map((status) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", status)),
  ]);

  const orderIds = (ordersResult.data ?? []).map((order) => order.id);
  const itemsResult = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_name,quantity,unit_price,variant_label").in("order_id", orderIds)
    : { data: [], error: null };
  const ticketIds = (ticketsResult.data ?? []).map((ticket) => ticket.id);
  const ticketMessagesResult = ticketIds.length
    ? await supabase.from("support_messages").select("id,ticket_id,sender_id,body,created_at").in("ticket_id", ticketIds).order("created_at")
    : { data: [], error: null };
  const items = new Map<string, { product_name: string; quantity: number; unit_price: number; variant_label: string | null }[]>();
  for (const item of itemsResult.data ?? []) {
    const current = items.get(item.order_id) ?? [];
    current.push(item);
    items.set(item.order_id, current);
  }
  const ticketMessages = new Map<string, { id: string; sender_id: string; body: string; created_at: string }[]>();
  for (const message of ticketMessagesResult.data ?? []) {
    const current = ticketMessages.get(message.ticket_id) ?? [];
    current.push(message);
    ticketMessages.set(message.ticket_id, current);
  }
  const supportTickets = (ticketsResult.data ?? []).map((ticket) => ({ ...ticket, messages: ticketMessages.get(ticket.id) ?? [] }));
  const counts = Object.fromEntries(ORDER_STATUSES.map((status, index) => [status, countResults[index].count ?? 0]));
  const errors = [
    productsResult.error, categoriesResult.error, variantsResult.error, digitalFilesResult.error, ordersResult.error,
    servicesResult.error, projectsResult.error, requestsResult.error, ticketsResult.error, itemsResult.error, ticketMessagesResult.error,
    ...countResults.map((result) => result.error),
  ].filter(Boolean).map((error) => error?.message);

  return (
    <>
      <PageHeader title="Admin area" intro={`Signed in as ${user.email ?? "admin"}`}>
        <Badge tone="ok">Admin verified by the database</Badge>
      </PageHeader>
      <Container className="py-10">
        <nav aria-label="Admin tools" className="mb-8 flex flex-wrap gap-3">
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/audit">Audit log</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/health">Health check</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/reviews">Product reviews</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/vendors">Vendors and affiliates</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/settings">Marketplace settings</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/vendor-products">Vendor products</Link>
          <Link className="rounded-xl border border-line px-4 py-3 text-cyan-soft underline" href="/admin/payouts">Payouts and earnings</Link>
        </nav>
        <AdminConsole
          products={productsResult.data ?? []}
          dualPricingAvailable={dualPricingAvailable}
          categories={categoriesResult.data ?? []}
          variants={variantsResult.data ?? []}
          digitalFiles={digitalFilesResult.data ?? []}
          orders={(ordersResult.data ?? []).map((order) => ({ ...order, items: items.get(order.id) ?? [] }))}
          counts={counts}
          loadError={errors.length ? `Some admin data could not be loaded: ${errors.join("; ")}` : undefined}
        />
        <ContentManagement
          services={servicesResult.data ?? []}
          projects={projectsResult.data ?? []}
          requests={requestsResult.data ?? []}
          tickets={supportTickets}
          loadError={errors.length ? `Some admin data could not be loaded: ${errors.join("; ")}` : undefined}
        />
      </Container>
    </>
  );
}

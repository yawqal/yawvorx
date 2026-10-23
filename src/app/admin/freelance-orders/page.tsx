import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Field";

export const metadata: Metadata = { title: "Freelancer orders | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ q?: string; status?: string }> };
const statusOptions = ["pending", "accepted", "declined", "in_progress", "submitted", "revision_requested", "completed", "cancelled"];

export default async function AdminFreelanceOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 100);
  const status = statusOptions.includes(params.status ?? "") ? params.status! : "";
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container>;
  let request = supabase.from("freelancer_orders").select("id,title,tier,agreed_price_etb,status,created_at").order("created_at", { ascending: false }).limit(500);
  if (status) request = request.eq("status", status);
  if (query) request = request.ilike("title", `%${query.replace(/[%_]/g, "")}%`);
  const result = await request;
  return <>
    <PageHeader title="Freelancer orders" intro="Read-only overview of freelancer marketplace orders." />
    <Container className="py-8 sm:py-10">
      <form method="get" className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,.5fr)_auto]">
        <Input label="Search title" name="q" defaultValue={query} maxLength={100} />
        <Select label="Filter by status" name="status" defaultValue={status}>
          <option value="">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
        </Select>
        <button type="submit" className="min-h-[44px] self-end rounded-xl border border-line px-5 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet">Apply filters</button>
      </form>
      {result.error ? <p role="alert" className="text-red-300">Orders could not be loaded: {result.error.message}</p>
        : !result.data?.length ? <Card><p>No orders yet.</p></Card>
          : <div className="grid gap-3">{result.data.map((order) => <Card key={order.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h2 className="break-words font-semibold">{order.title}</h2><p className="mt-1 text-sm capitalize text-ink-mute">{order.tier} · {new Date(order.created_at).toLocaleDateString()}</p></div>
            <div className="flex flex-wrap items-center gap-3"><span>{formatMoney(Number(order.agreed_price_etb), "ETB")}</span><Badge>{order.status.replace(/_/g, " ")}</Badge></div>
          </Card>)}</div>}
    </Container>
  </>;
}

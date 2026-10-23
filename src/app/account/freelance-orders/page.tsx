import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "My freelancer orders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AccountFreelanceOrdersPage() {
  const user = await requireUser("/account/freelance-orders");
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container>;
  const result = await supabase.from("freelancer_orders")
    .select("id,profile_id,title,agreed_price_etb,status,created_at")
    .eq("client_user_id", user.id).order("created_at", { ascending: false });
  const profileIds = [...new Set((result.data ?? []).map((order) => order.profile_id))];
  const profiles = profileIds.length
    ? await supabase.from("freelancer_profiles").select("id,display_name").in("id", profileIds)
    : { data: [], error: null };
  const names = new Map((profiles.data ?? []).map((profile) => [profile.id, profile.display_name]));
  return <>
    <PageHeader title="My freelancer orders" intro="Track projects you have ordered." />
    <Container className="py-8 sm:py-10">
      {result.error || profiles.error ? <p role="alert" className="text-red-300">Orders could not be loaded: {result.error?.message ?? profiles.error?.message}</p>
        : !result.data?.length ? <Card><p>No orders yet.</p><Button href="/freelancers" variant="secondary" className="mt-4">Find a freelancer</Button></Card>
          : <div className="grid gap-3">{result.data.map((order) => <Card key={order.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h2 className="break-words font-semibold">{order.title}</h2><p className="mt-1 text-sm text-ink-mute">{names.get(order.profile_id) ?? "Freelancer"} · {new Date(order.created_at).toLocaleDateString()}</p></div>
            <div className="flex flex-wrap items-center gap-3"><span>{formatMoney(Number(order.agreed_price_etb), "ETB")}</span><Badge>{order.status.replace(/_/g, " ")}</Badge><Button href={`/freelance-orders/${encodeURIComponent(order.id)}`} variant="secondary">View order</Button></div>
          </Card>)}</div>}
    </Container>
  </>;
}

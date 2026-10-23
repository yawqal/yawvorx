import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Freelancer orders", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function FreelancerOrdersPage() {
  const user = await requireUser("/freelancers/me/orders");
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container>;
  const profile = await supabase.from("freelancer_profiles").select("id").eq("user_id", user.id).maybeSingle();
  if (profile.error) return <Container className="py-10"><p role="alert" className="text-red-300">Profile could not be checked: {profile.error.message}</p></Container>;
  if (!profile.data) redirect("/freelancers/apply");
  const result = await supabase.from("freelancer_orders")
    .select("id,title,agreed_price_etb,status,created_at")
    .eq("freelancer_user_id", user.id).order("created_at", { ascending: false });
  return <>
    <PageHeader title="Freelancer orders" intro="Manage orders for your packages." />
    <Container className="py-8 sm:py-10">
      {result.error ? <p role="alert" className="text-red-300">Orders could not be loaded: {result.error.message}</p>
        : !result.data?.length ? <Card><p>No orders yet.</p></Card>
          : <div className="grid gap-3">{result.data.map((order) => <Card key={order.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h2 className="break-words font-semibold">{order.title}</h2><p className="mt-1 text-sm text-ink-mute">Client · {new Date(order.created_at).toLocaleDateString()}</p></div>
            <div className="flex flex-wrap items-center gap-3"><span>{formatMoney(Number(order.agreed_price_etb), "ETB")}</span><Badge>{order.status.replace(/_/g, " ")}</Badge><Button href={`/freelance-orders/${encodeURIComponent(order.id)}`} variant="secondary">View order</Button></div>
          </Card>)}</div>}
    </Container>
  </>;
}

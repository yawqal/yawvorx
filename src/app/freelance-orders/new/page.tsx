import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { FreelanceOrderCreateForm } from "@/components/marketplace/FreelanceOrderCreateForm";

export const metadata: Metadata = { title: "Order a freelancer package", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Props = { searchParams: Promise<{ service?: string }> };

export default async function NewFreelanceOrderPage({ searchParams }: Props) {
  const user = await requireUser("/freelance-orders/new");
  const { service } = await searchParams;
  if (!service) notFound();
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert">Database is not configured.</p></Container>;
  const result = await supabase.from("freelancer_services")
    .select("id,tier,title,price_etb,delivery_days,profile_id,freelancer_profiles!inner(status,display_name)")
    .eq("id", service).eq("is_active", true).eq("freelancer_profiles.status", "approved").maybeSingle();
  if (result.error) return <><PageHeader title="Order package" /><Container className="py-8"><p role="alert" className="text-red-300">Package could not be loaded: {result.error.message}</p></Container></>;
  if (!result.data) notFound();
  const relation = result.data.freelancer_profiles;
  const freelancer = Array.isArray(relation) ? relation[0] : relation;
  return <>
    <PageHeader title="Order a package" intro={freelancer?.display_name ?? "Freelancer package"} />
    <Container className="max-w-2xl py-8 sm:py-10">
      <Card className="grid gap-3">
        <h2 className="text-xl font-semibold">{result.data.title}</h2>
        <p className="capitalize text-ink-mute">{result.data.tier} · {result.data.delivery_days} delivery days</p>
        <p className="text-xl font-semibold">{formatMoney(Number(result.data.price_etb), "ETB")}</p>
        <FreelanceOrderCreateForm serviceId={result.data.id} userId={user.id} />
      </Card>
    </Container>
  </>;
}

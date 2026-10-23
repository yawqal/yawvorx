import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FreelanceOrderActions } from "@/components/marketplace/FreelanceOrderActions";
import { FreelanceOrderFiles } from "@/components/marketplace/FreelanceOrderFiles";

export const metadata: Metadata = { title: "Freelancer order", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };
const statuses = new Set(["pending", "accepted", "declined", "in_progress", "submitted", "revision_requested", "completed", "cancelled"]);

export default async function FreelanceOrderDetailPage({ params }: Props) {
  const user = await requireUser("/account/freelance-orders");
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) return <Container className="py-10"><p role="alert">Database is not configured.</p></Container>;
  const orderResult = await supabase.from("freelancer_orders")
    .select("id,profile_id,client_user_id,freelancer_user_id,tier,title,details,agreed_price_etb,delivery_days,deadline,status,created_at")
    .eq("id", id).maybeSingle();
  if (orderResult.error || !orderResult.data) notFound();
  const order = orderResult.data;
  const isFreelancer = order.freelancer_user_id === user.id;
  const isClient = order.client_user_id === user.id;
  if (!isFreelancer && !isClient) notFound();
  const [messagesResult, reviewResult, filesResult] = await Promise.all([
    supabase.from("freelancer_order_messages").select("id,sender_id,body,created_at").eq("order_id", id).order("created_at", { ascending: true }),
    supabase.from("freelancer_reviews").select("rating,comment,created_at").eq("order_id", id).maybeSingle(),
    supabase.from("freelancer_order_files").select("id,kind,filename,size_bytes,created_at").eq("order_id", id).order("created_at", { ascending: false }),
  ]);
  if (messagesResult.error || reviewResult.error) {
    return <><PageHeader title="Freelancer order" /><Container className="py-8"><p role="alert" className="text-red-300">Order details could not be loaded: {messagesResult.error?.message ?? reviewResult.error?.message}</p></Container></>;
  }
  const status = statuses.has(order.status) ? order.status : "pending";
  return <>
    <PageHeader title={order.title} intro="Freelancer order details">
      <Badge>{status.replace(/_/g, " ")}</Badge>
    </PageHeader>
    <Container className="max-w-4xl py-8 sm:py-10">
      <Card className="mb-6 min-w-0">
        <dl className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div><dt className="text-sm text-ink-mute">Package tier</dt><dd className="capitalize">{order.tier}</dd></div>
          <div><dt className="text-sm text-ink-mute">Agreed price</dt><dd>{formatMoney(Number(order.agreed_price_etb), "ETB")}</dd></div>
          <div><dt className="text-sm text-ink-mute">Delivery days</dt><dd>{order.delivery_days}</dd></div>
          <div><dt className="text-sm text-ink-mute">Deadline</dt><dd>{order.deadline ?? "Not set"}</dd></div>
          <div><dt className="text-sm text-ink-mute">Created</dt><dd>{new Date(order.created_at).toLocaleDateString()}</dd></div>
          <div className="sm:col-span-2"><dt className="text-sm text-ink-mute">Project details</dt><dd className="mt-1 whitespace-pre-wrap break-words">{order.details}</dd></div>
        </dl>
      </Card>
      <FreelanceOrderActions
        orderId={order.id}
        userId={user.id}
        freelancerUserId={order.freelancer_user_id}
        status={status as "pending" | "accepted" | "declined" | "in_progress" | "submitted" | "revision_requested" | "completed" | "cancelled"}
        messages={messagesResult.data ?? []}
        review={reviewResult.data}
      />
      <FreelanceOrderFiles
        orderId={order.id}
        status={status}
        isFreelancer={isFreelancer}
        files={filesResult.data ?? []}
        loadError={filesResult.error?.message}
      />
    </Container>
  </>;
}

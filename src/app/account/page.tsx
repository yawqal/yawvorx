import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { ProfileForm } from "@/components/auth/ProfileForm";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { requireUser, isCurrentUserAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function Account() {
  const user = await requireUser("/account");
  const supabase = getSupabaseServerClient()!; // exists, because a user was found
  // These queries run as the signed-in customer: the database returns ONLY their own rows.
  const [profileRes, ordersRes, admin] = await Promise.all([
    supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_ref, status, payment_status, total, created_at").order("created_at", { ascending: false }).limit(20),
    isCurrentUserAdmin(),
  ]);
  const orders = ordersRes.data ?? [];

  return (
    <>
      <PageHeader title="My account" intro={user.email ?? undefined}>{admin && <Badge tone="info">Administrator</Badge>}</PageHeader>
      <Container className="grid gap-6 py-10 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Profile</h2>
          {profileRes.error && <p role="alert" className="mt-2 text-red-300">Profile could not be loaded. Has the database setup been completed?</p>}
          <div className="mt-4">
            <ProfileForm userId={user.id} fullName={profileRes.data?.display_name ?? ""} phone={profileRes.data?.phone ?? ""} />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Order history</h2>
          {ordersRes.error ? (
            <p role="alert" className="mt-2 text-red-300">Orders could not be loaded. Has the database setup been completed?</p>
          ) : orders.length === 0 ? (
            <div className="mt-4"><EmptyState title="No orders yet" description="Orders you place while signed in will appear here once order saving is connected." action={{ label: "Visit the shop", href: "/shop" }} /></div>
          ) : (
            <ul className="mt-4 space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center justify-between rounded-xl border border-line p-3">
                  <div><p className="font-medium">{o.order_ref}</p><p className="text-sm text-ink-mute">{new Date(o.created_at).toLocaleDateString("en-GB")}</p></div>
                  <div className="text-right"><p className="font-display">{formatMoney(Number(o.total))}</p><Badge>{String(o.status).replace(/_/g, " ")} · {String(o.payment_status).replace(/_/g, " ")}</Badge></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          {admin && <Button href="/admin" variant="secondary">Admin area</Button>}
          <SignOutButton />
          <Link href="/forgot-password" className="inline-flex min-h-[44px] items-center px-2 text-ink-mute underline">Change password by email</Link>
        </div>
      </Container>
    </>
  );
}

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
import { AddressBook } from "@/components/account/AddressBook";
import { Wishlist } from "@/components/account/Wishlist";
import { ServiceRequests } from "@/components/account/ServiceRequests";
import { DigitalDownloads } from "@/components/account/DigitalDownloads";
import { requireUser, isCurrentUserAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

const comingSoon = "Coming soon";

export default async function Account() {
  const user = await requireUser("/account");
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="My account" /><Container className="py-10"><p role="alert" className="text-red-300">Account data is not available because the database is not configured.</p></Container></>;
  }
  const [
    profileRes, ordersRes, admin, addressesRes, wishlistRes, productsRes, requestsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_ref, status, payment_status, total, currency, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    isCurrentUserAdmin(),
    supabase.from("customer_addresses").select("id,label,full_name,phone,address_line,city,region,country,postal_code,is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
    supabase.from("wishlist_items").select("id,product_id").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id,name,slug").eq("is_published", true).order("name"),
    supabase.from("service_requests").select("id,service_type,details,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
  ]);
  const orderIds = (ordersRes.data ?? []).map((order) => order.id);
  const digitalItemsRes = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_type").in("order_id", orderIds)
    : { data: [], error: null };
  const digitalOrderIds = new Set((digitalItemsRes.data ?? []).filter((item) => item.product_type === "digital").map((item) => item.order_id));
  const wishlistProductIds = (wishlistRes.data ?? []).map((item) => item.product_id);
  const savedProductsRes = wishlistProductIds.length
    ? await supabase.from("products").select("id,name,slug").in("id", wishlistProductIds)
    : { data: [], error: null };
  const savedProducts = new Map((savedProductsRes.data ?? []).map((product) => [product.id, product]));
  const wishlist = (wishlistRes.data ?? []).flatMap((item) => {
    const product = savedProducts.get(item.product_id);
    return product ? [{ id: item.id, product_id: item.product_id, name: product.name, slug: product.slug }] : [];
  });
  const dataErrors = [
    profileRes.error, ordersRes.error, addressesRes.error, wishlistRes.error, productsRes.error,
    requestsRes.error, savedProductsRes.error, digitalItemsRes.error,
  ].filter(Boolean).map((error) => error?.message);
  const orders = ordersRes.data ?? [];

  return (
    <>
      <PageHeader title="My account" intro={user.email ?? undefined}>
        {admin && <Badge tone="info">Administrator</Badge>}
      </PageHeader>
      <Container className="space-y-10 py-10">
        {dataErrors.length > 0 && <p role="alert" className="rounded-xl border border-red-400/40 p-4 text-red-300">
          Some account sections could not load. Complete the required Supabase SQL setup and verify row-level permissions: {dataErrors.join("; ")}
        </p>}

        <section id="overview">
          <h2 className="mb-4 text-2xl font-semibold">Overview</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><p className="text-sm text-ink-mute">Orders</p><p className="mt-1 font-display text-2xl">{orders.length}</p></Card>
            <Card><p className="text-sm text-ink-mute">Saved addresses</p><p className="mt-1 font-display text-2xl">{addressesRes.data?.length ?? 0}</p></Card>
            <Card><p className="text-sm text-ink-mute">Wishlist items</p><p className="mt-1 font-display text-2xl">{wishlist.length}</p></Card>
          </div>
        </section>

        <section id="orders">
          <h2 className="mb-4 text-2xl font-semibold">My orders</h2>
          {ordersRes.error ? <p role="alert" className="text-red-300">Orders could not be loaded: {ordersRes.error.message}</p> : orders.length === 0 ? (
            <EmptyState title="No orders yet" description="Orders you place while signed in will appear here." action={{ label: "Visit the shop", href: "/shop" }} />
          ) : (
            <div className="space-y-3">
              {orders.map((order) => <Card key={order.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><Link href={`/account/orders/${order.id}`} className="font-semibold underline">{order.order_ref}</Link><p className="text-sm text-ink-mute">{new Date(order.created_at).toLocaleDateString()}</p></div>
                  <div className="text-right"><p className="font-display">{formatMoney(Number(order.total), order.currency)}</p><Badge>{order.status.replace(/_/g, " ")} · {order.payment_status.replace(/_/g, " ")}</Badge></div>
                </div>
                <Link className="mt-3 inline-block text-sm text-cyan-soft underline" href={`/account/orders/${order.id}`}>Order detail and tracking</Link>
              </Card>)}
            </div>
          )}
        </section>

        <section id="profile">
          <h2 className="mb-4 text-2xl font-semibold">Profile</h2>
          <Card>
            {profileRes.error && <p role="alert" className="mb-3 text-red-300">Profile could not be loaded: {profileRes.error.message}</p>}
            <ProfileForm userId={user.id} fullName={profileRes.data?.display_name ?? ""} phone={profileRes.data?.phone ?? ""} />
          </Card>
        </section>

        <section id="addresses">
          <h2 className="mb-4 text-2xl font-semibold">Addresses</h2>
          {addressesRes.error ? <p role="alert" className="text-red-300">Addresses could not be loaded: {addressesRes.error.message}</p>
            : <AddressBook initial={addressesRes.data ?? []} />}
        </section>

        <section id="wishlist">
          <h2 className="mb-4 text-2xl font-semibold">Wishlist</h2>
          {wishlistRes.error || productsRes.error || savedProductsRes.error
            ? <p role="alert" className="text-red-300">Wishlist could not be loaded. Confirm the customer dashboard SQL has been applied.</p>
            : <Wishlist choices={productsRes.data ?? []} saved={wishlist} />}
        </section>

        <section id="service-requests">
          <h2 className="mb-4 text-2xl font-semibold">Service requests</h2>
          {requestsRes.error
            ? <p role="alert" className="text-red-300">Service requests could not be loaded: {requestsRes.error.message}</p>
            : <ServiceRequests userId={user.id} initialName={profileRes.data?.display_name ?? ""} initialEmail={user.email ?? ""} requests={requestsRes.data ?? []} />}
        </section>

        <section id="downloads">
          <h2 className="mb-4 text-2xl font-semibold">Downloads</h2>
          {orders.filter((order) => order.payment_status === "paid" && digitalOrderIds.has(order.id)).length > 0
            ? <div className="space-y-3">{orders.filter((order) => order.payment_status === "paid" && digitalOrderIds.has(order.id)).map((order) => <Card key={order.id}>
              <h3 className="font-semibold">{order.order_ref}</h3><p className="text-sm text-ink-mute">Verified paid order</p>
              <DigitalDownloads orderId={order.id} />
            </Card>)}</div>
            : <Card><p className="text-ink-mute">No eligible digital downloads. Links become available after payment is verified.</p></Card>}
        </section>
        <section id="support"><h2 className="mb-3 text-2xl font-semibold">Support tickets</h2><Card><Badge>{comingSoon}</Badge><p className="mt-2 text-ink-mute">Support conversations are not available yet.</p></Card></section>
        <section id="notifications"><h2 className="mb-3 text-2xl font-semibold">Notifications</h2><Card><Badge>{comingSoon}</Badge><p className="mt-2 text-ink-mute">You have no in-app notifications yet.</p></Card></section>

        <section id="security">
          <h2 className="mb-4 text-2xl font-semibold">Security</h2>
          <Card className="flex flex-wrap items-center gap-3">
            <Link href="/forgot-password" className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-ink-mute underline">Change password by email</Link>
            <SignOutButton />
          </Card>
        </section>
        <section id="settings"><h2 className="mb-3 text-2xl font-semibold">Settings</h2><Card><Badge>{comingSoon}</Badge><p className="mt-2 text-ink-mute">Additional account preferences are not available yet.</p></Card></section>
        <section id="language"><h2 className="mb-3 text-2xl font-semibold">Language</h2><Card><p>English</p><p className="mt-1 text-sm text-ink-mute">Language selection is coming soon.</p></Card></section>

        <div className="flex flex-wrap gap-3">
          {admin && <Button href="/admin" variant="secondary">Admin area</Button>}
          <Button href="/shop" variant="ghost">Continue shopping</Button>
        </div>
      </Container>
    </>
  );
}

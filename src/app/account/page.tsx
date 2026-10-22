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
import { SupportTickets } from "@/components/account/SupportTickets";
import { requireUser, isCurrentUserAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { VendorApplication } from "@/components/account/VendorApplication";
import { LanguageToggle, TranslatedText } from "@/components/i18n/LanguageProvider";
import { ProfilePhoto } from "@/components/account/ProfilePhoto";

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
    profileRes, ordersRes, admin, addressesRes, wishlistRes, productsRes, requestsRes, ticketsRes, notificationsRes,
    vendorApplicationRes,
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, phone, avatar_path").eq("id", user.id).maybeSingle(),
    supabase.from("orders").select("id, order_ref, status, payment_status, total, currency, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    isCurrentUserAdmin(),
    supabase.from("customer_addresses").select("id,label,full_name,phone,address_line,city,region,country,postal_code,is_default").eq("user_id", user.id).order("is_default", { ascending: false }),
    supabase.from("wishlist_items").select("id,product_id").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("products").select("id,name,slug").eq("is_published", true).order("name"),
    supabase.from("service_requests").select("id,service_type,details,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("support_tickets").select("id,subject,status,created_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50),
    supabase.from("notifications").select("id,title,body,href,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("vendor_applications").select("business_name,contact_value,description,status,admin_note,referral_code").eq("user_id", user.id).maybeSingle(),
  ]);
  const avatarColumnMissing = Boolean(profileRes.error && /avatar_path/i.test(profileRes.error.message) &&
    /column|schema cache|does not exist|could not find/i.test(profileRes.error.message));
  const fallbackProfileRes = avatarColumnMissing
    ? await supabase.from("profiles").select("display_name, phone").eq("id", user.id).maybeSingle()
    : null;
  const profile = avatarColumnMissing ? fallbackProfileRes?.data : profileRes.data;
  const profileError = avatarColumnMissing ? fallbackProfileRes?.error : profileRes.error;
  const avatarPath = avatarColumnMissing ? null : profileRes.data?.avatar_path ?? null;
  const photoConfigured = !avatarColumnMissing && !profileRes.error;
  let avatarUrl: string | null = null;
  if (avatarPath) {
    const { data, error } = await supabase.storage.from("profile-photos").createSignedUrl(avatarPath, 3600);
    if (error) console.error("Could not create a signed profile photo URL:", error.message);
    else avatarUrl = data.signedUrl;
  }
  const vendorProfileRes = await supabase.from("vendor_profiles").select("status")
    .eq("user_id", user.id).maybeSingle();
  const affiliateCodeRes = vendorApplicationRes.data?.referral_code
    ? await supabase.from("affiliate_codes").select("code,is_active")
      .eq("code", vendorApplicationRes.data.referral_code).eq("is_active", true).maybeSingle()
    : { data: null, error: null };
  const orderIds = (ordersRes.data ?? []).map((order) => order.id);
  const digitalItemsRes = orderIds.length
    ? await supabase.from("order_items").select("order_id,product_type").in("order_id", orderIds)
    : { data: [], error: null };
  const digitalOrderIds = new Set((digitalItemsRes.data ?? []).filter((item) => item.product_type === "digital").map((item) => item.order_id));
  const ticketIds = (ticketsRes.data ?? []).map((ticket) => ticket.id);
  const ticketMessagesRes = ticketIds.length
    ? await supabase.from("support_messages").select("id,ticket_id,sender_id,body,created_at").in("ticket_id", ticketIds).order("created_at")
    : { data: [], error: null };
  const ticketMessages = new Map<string, { id: string; sender_id: string; body: string; created_at: string }[]>();
  for (const message of ticketMessagesRes.data ?? []) {
    const current = ticketMessages.get(message.ticket_id) ?? [];
    current.push(message);
    ticketMessages.set(message.ticket_id, current);
  }
  const supportTickets = (ticketsRes.data ?? []).map((ticket) => ({ ...ticket, messages: ticketMessages.get(ticket.id) ?? [] }));
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
    profileError, ordersRes.error, addressesRes.error, wishlistRes.error, productsRes.error,
    requestsRes.error, savedProductsRes.error, digitalItemsRes.error, ticketsRes.error, ticketMessagesRes.error, notificationsRes.error, vendorProfileRes.error,
  ].filter(Boolean).map((error) => error?.message);
  const orders = ordersRes.data ?? [];

  return (
    <>
      <div className="border-b border-line bg-aurora">
        <Container className="grid gap-8 py-9 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <ProfilePhoto userId={user.id} name={profile?.display_name ?? ""} email={user.email ?? ""} initialUrl={avatarUrl}
              initialPath={avatarPath} configured={photoConfigured} />
            <div className="text-center sm:text-left">
              {admin && <Badge tone="info">Administrator</Badge>}
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {profile?.display_name ? `Welcome back, ${profile.display_name}` : "Your account"}
              </h1>
              <p className="mt-2 max-w-xl text-ink-mute">Your orders, saved items, and account details in one place.</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
            {admin && <Button href="/admin" variant="secondary">Admin area</Button>}
            <Button href="/shop" variant="ghost"><TranslatedText value="Continue shopping" /></Button>
          </div>
        </Container>
      </div>
      <Container className="grid gap-8 py-8 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Account sections" className="h-fit lg:sticky lg:top-24">
          <p className="hidden pb-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-mute lg:block">Account menu</p>
          <div className="flex gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:border-l lg:border-line lg:pb-0">
            {[
              ["overview", "Overview"], ["orders", "Orders"], ["profile", "Profile"], ["addresses", "Addresses"],
              ["wishlist", "Wishlist"], ["service-requests", "Requests"], ["downloads", "Downloads"], ["support", "Support"],
              ["notifications", "Notifications"], ["vendor", "Vendor"], ["settings", "Settings"], ["language", "Language"], ["security", "Security"],
            ].map(([id, label]) => <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-line px-3 py-2 text-sm text-ink-mute transition hover:border-violet/50 hover:text-ink lg:rounded-none lg:border-0 lg:border-l-2 lg:px-4 lg:py-2 lg:hover:border-violet">
              {label}
            </a>)}
          </div>
        </nav>
        <div className="min-w-0 space-y-12">
        {dataErrors.length > 0 && <p role="alert" className="rounded-xl border border-red-400/40 p-4 text-red-300">
          Some account sections could not load. Complete the required Supabase SQL setup and verify row-level permissions: {dataErrors.join("; ")}
        </p>}
        <section id="overview">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Your dashboard</p><h2 className="mt-2 text-2xl font-semibold"><TranslatedText value="Overview" /></h2></div>
            <span className="hidden text-sm text-ink-mute sm:block">A personal space for everything you do with ZIKA</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-gradient-to-br from-violet/15 to-obsidian-900"><p className="text-sm text-ink-mute"><TranslatedText value="Orders" /></p><p className="mt-3 font-display text-4xl">{orders.length}</p><a href="#orders" className="mt-4 inline-flex text-sm text-cyan-soft">View order history <span aria-hidden="true" className="ml-2">↗</span></a></Card>
            <Card><p className="text-sm text-ink-mute">Saved addresses</p><p className="mt-3 font-display text-4xl">{addressesRes.data?.length ?? 0}</p><a href="#addresses" className="mt-4 inline-flex text-sm text-ink-mute hover:text-ink">Manage delivery details ↗</a></Card>
            <Card><p className="text-sm text-ink-mute">Wishlist items</p><p className="mt-3 font-display text-4xl">{wishlist.length}</p><a href="#wishlist" className="mt-4 inline-flex text-sm text-ink-mute hover:text-ink">Browse saved products ↗</a></Card>
          </div>
        </section>

        <section id="orders">
          <div className="mb-4 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-soft">Recent activity</p><h2 className="mt-2 text-2xl font-semibold"><TranslatedText value="My orders" /></h2></div><span className="text-sm text-ink-mute">{orders.length} total</span></div>
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
          <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-soft">Your details</p><h2 className="mt-2 text-2xl font-semibold"><TranslatedText value="Profile" /></h2></div>
          <Card className="max-w-3xl">
            {profileError && <p role="alert" className="mb-3 text-red-300">Profile could not be loaded: {profileError.message}</p>}
            <ProfileForm userId={user.id} fullName={profile?.display_name ?? ""} phone={profile?.phone ?? ""} />
          </Card>
        </section>

        <section id="addresses">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Addresses" /></h2>
          {addressesRes.error ? <p role="alert" className="text-red-300">Addresses could not be loaded: {addressesRes.error.message}</p>
            : <AddressBook initial={addressesRes.data ?? []} />}
        </section>

        <section id="wishlist">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Wishlist" /></h2>
          {wishlistRes.error || productsRes.error || savedProductsRes.error
            ? <p role="alert" className="text-red-300">Wishlist could not be loaded. Confirm the customer dashboard SQL has been applied.</p>
            : <Wishlist choices={productsRes.data ?? []} saved={wishlist} />}
        </section>

        <section id="service-requests">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Service requests" /></h2>
          {requestsRes.error
            ? <p role="alert" className="text-red-300">Service requests could not be loaded: {requestsRes.error.message}</p>
            : <ServiceRequests userId={user.id} initialName={profileRes.data?.display_name ?? ""} initialEmail={user.email ?? ""} requests={requestsRes.data ?? []} />}
        </section>

        <section id="downloads">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Downloads" /></h2>
          {orders.filter((order) => order.payment_status === "paid" && digitalOrderIds.has(order.id)).length > 0
            ? <div className="space-y-3">{orders.filter((order) => order.payment_status === "paid" && digitalOrderIds.has(order.id)).map((order) => <Card key={order.id}>
              <h3 className="font-semibold">{order.order_ref}</h3><p className="text-sm text-ink-mute">Verified paid order</p>
              <DigitalDownloads orderId={order.id} />
            </Card>)}</div>
            : <Card><p className="text-ink-mute">No eligible digital downloads. Links become available after payment is verified.</p></Card>}
        </section>
        <section id="support">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Support tickets" /></h2>
          {ticketsRes.error || ticketMessagesRes.error
            ? <p role="alert" className="text-red-300">Support tickets could not be loaded. Confirm the notifications/support SQL has been applied.</p>
            : <SupportTickets userId={user.id} tickets={supportTickets} />}
        </section>
        <section id="notifications">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Notifications" /></h2>
          {notificationsRes.error ? <p role="alert" className="text-red-300">Notifications could not be loaded: {notificationsRes.error.message}</p> : (
            <div className="space-y-3">
              {(notificationsRes.data ?? []).map((notice) => <Card key={notice.id}>
                <div className="flex items-center gap-2"><h3 className="font-semibold">{notice.title}</h3>{!notice.read_at && <Badge tone="info">New</Badge>}</div>
                {notice.body && <p className="mt-1 text-sm text-ink-mute">{notice.body}</p>}
                <p className="mt-1 text-xs text-ink-mute">{new Date(notice.created_at).toLocaleString()}</p>
                {notice.href?.startsWith("/") && !notice.href.startsWith("//") && <Link href={notice.href} className="mt-2 inline-block text-sm text-cyan-soft underline">Open</Link>}
              </Card>)}
              {notificationsRes.data?.length === 0 && <Card><p className="text-ink-mute">No notifications yet. New support replies will appear here and in the navigation bell.</p></Card>}
            </div>
          )}
        </section>

        <section id="security">
          <h2 className="mb-4 text-2xl font-semibold"><TranslatedText value="Security" /></h2>
          <Card className="flex flex-wrap items-center gap-3">
            <Link href="/forgot-password" className="inline-flex min-h-[44px] items-center rounded-xl border border-line px-4 text-ink-mute underline">Change password by email</Link>
            <SignOutButton />
          </Card>
        </section>
        <section id="vendor">
          <h2 className="mb-3 text-2xl font-semibold">Vendor application</h2>
          {vendorApplicationRes.error
            ? <p role="alert" className="text-amber-300">Vendor applications are not configured yet. The owner must review the vendor SQL proposal.</p>
            : <VendorApplication
              application={vendorApplicationRes.data}
              activeReferralCode={affiliateCodeRes.data?.is_active ? affiliateCodeRes.data.code : null}
              referralTrackingAvailable={!affiliateCodeRes.error}
            />}
        </section>
        <section id="settings"><h2 className="mb-3 text-2xl font-semibold"><TranslatedText value="Settings" /></h2><Card><Badge>{comingSoon}</Badge><p className="mt-2 text-ink-mute">Additional account preferences are not available yet.</p></Card></section>
        <section id="language"><h2 className="mb-3 text-2xl font-semibold"><TranslatedText value="Language" /></h2><Card className="flex items-center justify-between gap-3"><p>Choose English or Amharic for the navigation, footer, shop filters, and account headings.</p><LanguageToggle /></Card></section>

        <div className="flex flex-wrap gap-3 border-t border-line pt-6">
          {admin && <Button href="/admin" variant="secondary">Admin area</Button>}
          {vendorProfileRes.data?.status === "active" && <Button href="/vendor/products" variant="secondary">My vendor products</Button>}
          {(vendorProfileRes.data?.status === "active" || vendorApplicationRes.data?.status === "approved") && <Button href="/account/earnings" variant="secondary">My earnings</Button>}
          <Button href="/shop" variant="ghost"><TranslatedText value="Continue shopping" /></Button>
        </div>
        </div>
      </Container>
    </>
  );
}

"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { EmptyState, LoadingState } from "@/components/ui/States";
import { PreparedMessage } from "./PreparedMessage";
import { formatMoney } from "@/lib/format";
import { isConfigured, siteConfig } from "@/config/site";
import { BLANK, joinLines, validateCheckout, type CheckoutValues, type Errors } from "@/lib/validation";

const METHODS = ["WhatsApp-assisted ordering", "Manual payment (instructions after review)"];

type Placed = { order_ref: string; guest_token?: string; total: number; currency: string; duplicate?: boolean; message: string; manual: boolean };

function newKey(): string {
  try { return `yvx-${crypto.randomUUID()}`; }
  catch { return `yvx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`; }
}

/** Turns a database error code into a clear message. Unknown errors never show technical details. */
function friendly(message: string): string {
  const code = /YVX_[A-Z_]+/.exec(message)?.[0] ?? "";
  switch (code) {
    case "YVX_INVALID_CURRENCY": return "Please choose ETB or USD.";
    case "YVX_PRICE_UNAVAILABLE": return "This item is not available in the selected currency. Remove it or switch currency.";
    case "YVX_VARIANT_DELTA_CURRENCY": return "This option is only available in the product's original currency.";
    case "YVX_BAD_PRICE": return "This item's price is invalid. Please contact us.";
    case "YVX_BAD_IDEMPOTENCY_KEY": return "Your order request expired. Please try again.";
    case "YVX_INVALID_CUSTOMER": return "Please check your details and try again.";
    case "YVX_INVALID_PAYMENT_METHOD": return "Please choose a valid payment method.";
    case "YVX_SHIPPING_CURRENCY_UNSET": return "Shipping is not set up for this currency. Please contact us.";
    case "YVX_OUT_OF_STOCK": return "One of the items is out of stock, or fewer units are left than you asked for. Please lower the quantity or remove it from your cart.";
    case "YVX_PRODUCT_UNAVAILABLE":
    case "YVX_VARIANT_UNAVAILABLE": return "One of the items is no longer available. Please remove it from your cart and try again.";
    case "YVX_VARIANT_REQUIRED": return "Please choose an option for every product, then try again.";
    case "YVX_MIXED_CURRENCY": return "Your cart has items in different currencies. Please order them separately.";
    case "YVX_ADDRESS_REQUIRED": return "A delivery address and city are required for physical products.";
    case "YVX_INVALID_NAME": return "Please enter your full name.";
    case "YVX_INVALID_PHONE": return "Please enter a valid phone number with country code.";
    case "YVX_INVALID_EMAIL": return "Please enter a valid email address or leave it empty.";
    case "YVX_FIELD_TOO_LONG": return "One of your answers is too long. Please shorten it.";
    case "YVX_RATE_LIMIT": return "Too many orders in a short time. Please wait a while and try again.";
    case "YVX_EMPTY_CART":
    case "YVX_INVALID_ITEM":
    case "YVX_TOO_MANY_ITEMS": return "Your cart could not be processed. Please review it and try again.";
    default: return "We could not place your order. Please try again in a moment, or contact us.";
  }
}

export function CheckoutForm() {
  const { items, ready, subtotal, currency, clear } = useCart();
  const [v, setV] = useState<CheckoutValues>({ name: "", phone: "", email: "", address: "", city: "", country: "", notes: "", method: METHODS[0] });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);
  const [copied, setCopied] = useState(false);
  const keyRef = useRef<string>("");

  const pay = siteConfig.manualPaymentInstructions;

  if (placed) {
    const copyToken = async () => {
      try { await navigator.clipboard.writeText(placed.guest_token ?? ""); setCopied(true); } catch { setCopied(false); }
    };
    return (
      <div className="space-y-4">
        <Card>
          <h2 className="text-xl font-semibold">Order received</h2>
          <p className="mt-2 text-ink-mute">Order reference: <span className="font-display text-ink">{placed.order_ref}</span></p>
          <p className="text-ink-mute">Total: <span className="font-display text-ink">{formatMoney(placed.total, placed.currency)}</span></p>
          <p className="mt-2 text-sm text-ink-mute">Your order is waiting for review. It is confirmed only after YAWVOREX verifies your payment.</p>
        </Card>
        {placed.guest_token ? (
          <Card>
            <h2 className="text-lg font-semibold">Your tracking code</h2>
            <p className="mt-2 break-all rounded-xl border border-line bg-obsidian-800 p-3 font-mono text-sm">{placed.guest_token}</p>
            <p className="mt-2 text-sm text-amber-300">Save this code now. It is shown only once. You need it with your order reference to track this order.</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Button onClick={copyToken}>{copied ? "Copied" : "Copy tracking code"}</Button>
              <Button variant="secondary" href={`/track?ref=${encodeURIComponent(placed.order_ref)}`}>Track this order</Button>
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-ink-mute">This order was already placed, so the tracking code cannot be shown again. If you saved it, use it on the <Link href={`/track?ref=${encodeURIComponent(placed.order_ref)}`} className="underline">Track order</Link> page, or contact us with your order reference.</p>
          </Card>
        )}
        <PreparedMessage title="Send your order to YAWVOREX" message={placed.message} subject={`Order ${placed.order_ref}`} saved />
        {placed.manual && (
          <Card><h2 className="text-lg font-semibold">Manual payment</h2>
            <p className="mt-2 text-ink-mute">{isConfigured(pay) ? pay : "Payment instructions will be sent by YAWVOREX after your order is reviewed."}</p>
            <p className="mt-2 text-sm text-ink-mute">Never send card numbers, CVVs, or passwords.</p></Card>
        )}
        <Button variant="ghost" href="/shop">Continue shopping</Button>
      </div>
    );
  }

  if (!ready) return <LoadingState />;
  if (items.length === 0) return <EmptyState title="Your cart is empty" description="Add products before checking out." action={{ label: "Shop products", href: "/shop" }} />;

  const needsAddress = items.some((i) => i.type === "physical");
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setFail(null);
    const found = validateCheckout(v, needsAddress);
    setErrors(found);
    if (Object.keys(found).length) return;

    if (!keyRef.current) keyRef.current = newKey();

    // Only product, option and quantity are sent. The server decides prices, stock and totals.
    const payload = {
      p_items: items.map((i) => ({ slug: i.slug, variant_id: i.variantId ?? null, qty: i.qty })),
      p_customer: {
        name: v.name.trim(), phone: v.phone.trim(), email: v.email.trim(),
        address: needsAddress ? v.address.trim() : "", city: needsAddress ? v.city.trim() : "",
        country: needsAddress ? v.country.trim() : "", notes: v.notes.trim(),
      },
      p_idempotency_key: keyRef.current,
      p_payment_method: v.method.startsWith("Manual") ? "manual" : "whatsapp",
      p_currency: items[0]?.currency ?? null,
    };
    const lines = items.map((i) => `- ${i.qty} x ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""}`);

    setBusy(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { data?: unknown; error?: string };
      if (!response.ok || !result.data) { setFail(friendly(result.error ?? "")); return; }
      const res = result.data as { order_ref: string; guest_token?: string; total: number; currency: string; duplicate?: boolean };
      const message = joinLines([
        "New order (YAWVOREX)", `Order reference: ${res.order_ref}`, ...lines, `Total: ${formatMoney(Number(res.total), res.currency)}`, BLANK,
        `Name: ${v.name.trim()}`, `Phone: ${v.phone.trim()}`, v.email.trim() && `Email: ${v.email.trim()}`,
        needsAddress && `Delivery: ${v.address.trim()}, ${v.city.trim()}, ${v.country.trim()}`,
        `Method: ${v.method}`, v.notes.trim() && `Notes: ${v.notes.trim()}`,
      ]);
      setPlaced({ ...res, total: Number(res.total), message, manual: v.method.startsWith("Manual") });
      clear();
    } catch {
      setFail("We could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form onSubmit={submit} noValidate className="space-y-5">
        <Input label="Full name" name="name" autoComplete="name" value={v.name} onChange={change} error={errors.name} />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input label="Phone (with country code)" name="phone" type="tel" autoComplete="tel" value={v.phone} onChange={change} error={errors.phone} />
          <Input label="Email (optional)" name="email" type="email" autoComplete="email" value={v.email} onChange={change} error={errors.email} />
        </div>
        {needsAddress && (<>
          <Input label="Delivery address" name="address" autoComplete="street-address" value={v.address} onChange={change} error={errors.address} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input label="City" name="city" autoComplete="address-level2" value={v.city} onChange={change} error={errors.city} />
            <Input label="Country" name="country" autoComplete="country-name" value={v.country} onChange={change} error={errors.country} />
          </div>
        </>)}
        <Select label="Ordering method" name="method" value={v.method} onChange={change} error={errors.method}>{METHODS.map((m) => <option key={m}>{m}</option>)}</Select>
        <Textarea label="Notes (optional)" name="notes" rows={3} value={v.notes} onChange={change} />
        <p className="text-sm text-ink-mute">Never send card numbers, CVVs, or passwords. YAWVOREX does not collect them.</p>
        {fail && <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-red-300">{fail}</p>}
        <Button type="submit" className="w-full sm:w-auto" loading={busy} disabled={busy}>Place order request</Button>
      </form>
      <Card className="h-fit">
        <h2 className="text-lg font-semibold">Your items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((i) => <li key={i.key} className="flex justify-between gap-3"><span>{i.qty} × {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}</span><span>{formatMoney(i.qty * i.unitPrice, i.currency)}</span></li>)}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-3"><span>Subtotal</span><span className="font-display">{formatMoney(subtotal, currency ?? undefined)}</span></div>
        <p className="mt-2 text-xs text-ink-mute">Shipping, if any, and the final total are calculated by our server when you place the order.</p>
      </Card>
    </div>
  );
}

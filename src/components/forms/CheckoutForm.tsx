"use client";
import { useState } from "react";
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

export function CheckoutForm() {
  const { items, ready, subtotal } = useCart();
  const [v, setV] = useState<CheckoutValues>({ name: "", phone: "", email: "", address: "", city: "", country: "", notes: "", method: METHODS[0] });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);

  if (!ready) return <LoadingState />;
  if (items.length === 0) return <EmptyState title="Your cart is empty" description="Add products before checking out." action={{ label: "Shop products", href: "/shop" }} />;

  const needsAddress = items.some((i) => i.type === "physical");
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCheckout(v, needsAddress);
    setErrors(found);
    if (Object.keys(found).length) return;
    const lines = items.map((i) => `- ${i.qty} x ${i.name}${i.variantLabel ? ` (${i.variantLabel})` : ""}: ${formatMoney(i.qty * i.unitPrice)}`);
    setMessage(joinLines([
      "New order request (YAWVOREX)", ...lines, `Subtotal: ${formatMoney(subtotal)} (to be confirmed)`, BLANK,
      `Name: ${v.name.trim()}`, `Phone: ${v.phone.trim()}`, v.email.trim() && `Email: ${v.email.trim()}`,
      needsAddress && `Delivery: ${v.address.trim()}, ${v.city.trim()}, ${v.country.trim()}`,
      `Method: ${v.method}`, v.notes.trim() && `Notes: ${v.notes.trim()}`,
    ]));
  };

  const pay = siteConfig.manualPaymentInstructions;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      {message ? (
        <div className="space-y-4">
          <PreparedMessage title="Your order request is ready" message={message} subject="Order request" />
          {v.method.startsWith("Manual") && (
            <Card><h2 className="text-lg font-semibold">Manual payment</h2>
              <p className="mt-2 text-ink-mute">{isConfigured(pay) ? pay : "Payment instructions will be sent by YAWVOREX after your order request is reviewed."}</p>
              <p className="mt-2 text-sm text-ink-mute">An order is confirmed only after an administrator verifies your payment.</p></Card>
          )}
          <Button variant="ghost" onClick={() => setMessage(null)}>Edit details</Button>
        </div>
      ) : (
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
          <Button type="submit" className="w-full sm:w-auto">Prepare my order request</Button>
        </form>
      )}
      <Card className="h-fit">
        <h2 className="text-lg font-semibold">Your items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {items.map((i) => <li key={i.key} className="flex justify-between gap-3"><span>{i.qty} × {i.name}{i.variantLabel ? ` (${i.variantLabel})` : ""}</span><span>{formatMoney(i.qty * i.unitPrice)}</span></li>)}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-3"><span>Subtotal</span><span className="font-display">{formatMoney(subtotal)}</span></div>
      </Card>
    </div>
  );
}

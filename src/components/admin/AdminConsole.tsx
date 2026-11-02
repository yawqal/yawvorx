"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { formatMoney } from "@/lib/format";

type Product = {
  id: string; name: string; slug: string; description: string; price: number; currency: string;
  price_etb?: number | null; price_usd?: number | null;
  stock: number; image_url: string | null; category_id: number | null; product_type: string;
  is_demo: boolean; is_published: boolean;
};
type Category = { id: number; name: string; slug: string };
type Variant = { id: string; product_id: string; label: string; stock: number | null };
type DigitalFile = { id: string; product_id: string; variant_id: string | null; storage_path: string; file_name: string };
type Item = { product_name: string; quantity: number; unit_price: number; variant_label: string | null };
type Order = {
  id: string; order_ref: string; customer_name: string; customer_email: string; status: string;
  payment_status: string; currency: string; total: number; created_at: string; payment_method: string | null;
  items: Item[];
};
type ProductDraft = {
  id: string; name: string; slug: string; description: string; price: string; price_etb: string; price_usd: string; currency: string;
  stock: string; image_url: string; category_id: string; product_type: string; is_demo: boolean; is_published: boolean;
};

type Props = { products: Product[]; dualPricingAvailable: boolean; categories: Category[]; variants: Variant[]; digitalFiles: DigitalFile[]; orders: Order[]; counts: Record<string, number>; loadError?: string };
type Payload = Record<string, string | number | boolean | null>;

const inputClass = "w-full min-h-[44px] rounded-xl border border-line bg-obsidian-800 px-4 py-2.5 text-base text-ink";
const transitions: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"], confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"], shipped: ["completed"], completed: [], cancelled: [],
};

function blankProduct(categoryId = ""): ProductDraft {
  return { id: "", name: "", slug: "", description: "", price: "", price_etb: "", price_usd: "", currency: "ETB", stock: "0", image_url: "", category_id: categoryId, product_type: "physical", is_demo: false, is_published: false };
}

export function AdminConsole({ products, dualPricingAvailable, categories, variants, digitalFiles, orders, counts, loadError }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  async function send(values: Payload): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      const result = await response.json() as { error?: string; warning?: string };
      if (!response.ok) { setMessage(result.error ?? "The action failed."); return false; }
      setMessage(result.warning ?? "Saved.");
      router.refresh();
      return true;
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const filteredOrders = orders.filter((order) =>
    (!statusFilter || order.status === statusFilter) &&
    (!dateFilter || order.created_at.slice(0, 10) === dateFilter));

  return (
    <div className="space-y-8">
      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 p-4 text-red-300">{loadError}</p>}
      {message && <p role="status" className="rounded-xl border border-brand/30 p-3 text-secondary-soft">{message}</p>}

      <section id="admin-overview" className="scroll-mt-24">
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Operations</p><h2 className="mt-2 text-2xl font-semibold">Orders overview</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {Object.entries(counts).map(([status, count]) => (
            <Card key={status}><p className="text-sm capitalize text-ink-mute">{status.replace(/_/g, " ")}</p><p className="mt-2 font-display text-2xl">{count}</p></Card>
          ))}
        </div>
      </section>

      <section id="admin-products" className="scroll-mt-24">
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">Catalog</p><h2 className="mt-2 text-2xl font-semibold">Products and stock</h2></div>
        <Card>
          <h3 className="text-lg font-semibold">Add product</h3>
          <ProductEditor categories={categories} initial={blankProduct(String(categories[0]?.id ?? ""))} dualPricingAvailable={dualPricingAvailable} digitalFiles={[]} onSave={send} busy={busy} />
        </Card>
        <div className="mt-4 space-y-4">
          {products.map((product) => (
            <Card key={product.id}>
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 [&::-webkit-details-marker]:hidden">
                  <span className="mr-auto font-semibold">{product.name}</span>
                  <Badge tone={product.stock <= 5 ? "warn" : "ok"}>{product.stock <= 5 ? `Low stock: ${product.stock}` : `Stock: ${product.stock}`}</Badge>
                  <Badge>{product.is_demo ? "Demo" : "Live"}</Badge>
                  <Badge>{product.is_published ? "Active" : "Inactive"}</Badge>
                  <span className="text-sm text-secondary-soft">Edit product ↓</span>
                </summary>
                <p className="mt-3 text-sm text-ink-mute">
                  {typeof product.price_etb === "number" && Number.isFinite(product.price_etb) &&
                  typeof product.price_usd === "number" && Number.isFinite(product.price_usd)
                    ? `${formatMoney(product.price_etb, "ETB")} · ${formatMoney(product.price_usd, "USD")}`
                    : `Current price: ${formatMoney(product.price, product.currency)}`}
                </p>
                <ProductEditor categories={categories} initial={{
                  ...product, description: product.description ?? "", image_url: product.image_url ?? "",
                  price: String(product.price), price_etb: String(product.price_etb ?? ""), price_usd: String(product.price_usd ?? ""), stock: String(product.stock),
                  category_id: product.category_id === null ? "" : String(product.category_id),
                }} dualPricingAvailable={dualPricingAvailable} digitalFiles={digitalFiles.filter((file) => file.product_id === product.id)} onSave={send} busy={busy} />
              {variants.filter((v) => v.product_id === product.id).length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <h4 className="font-medium">Variant stock</h4>
                  <div className="mt-2 space-y-2">
                    {variants.filter((v) => v.product_id === product.id).map((variant) => (
                      <VariantStock key={variant.id} variant={variant} productId={product.id} onSave={send} busy={busy} />
                    ))}
                  </div>
                </div>
              )}
                {product.is_published && <Button className="mt-4" variant="secondary" disabled={busy} onClick={() => void send({ action: "deactivate_product", id: product.id })}>Deactivate (soft delete)</Button>}
              </details>
            </Card>
          ))}
          {products.length === 0 && <p className="text-ink-mute">No products were returned. Confirm the Supabase migrations and permissions have been applied.</p>}
        </div>
      </section>

      <section id="admin-categories" className="scroll-mt-24">
        <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">Organization</p><h2 className="mt-2 text-2xl font-semibold">Categories</h2></div>
        <Card><CategoryEditor initial={{ id: "", name: "", slug: "" }} onSave={send} busy={busy} /></Card>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {categories.map((category) => <Card key={category.id}><CategoryEditor initial={{ id: String(category.id), name: category.name, slug: category.slug }} onSave={send} busy={busy} /></Card>)}
        </div>
      </section>

      <section id="admin-orders" className="scroll-mt-24">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold">Orders</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-ink-mute">Filter status
              <select className={inputClass} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>{Object.keys(transitions).map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>
            <label className="text-sm text-ink-mute">Filter date<input type="date" className={inputClass} value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} /></label>
          </div>
        </div>
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{order.order_ref}</h3>
                  <p className="text-sm text-ink-mute">{order.customer_name} · {order.customer_email}</p>
                  <p className="text-sm text-ink-mute">{new Date(order.created_at).toLocaleString()} · {order.currency} {Number(order.total).toFixed(2)}</p>
                </div>
                <div className="flex flex-wrap gap-2"><Badge>{order.status}</Badge><Badge tone={order.payment_status === "paid" ? "ok" : "warn"}>{order.payment_status}</Badge></div>
              </div>
              <ul className="my-3 space-y-1 text-sm text-ink-mute">
                {order.items.map((item, index) => <li key={`${item.product_name}-${index}`}>{item.quantity} × {item.product_name}{item.variant_label ? ` (${item.variant_label})` : ""} — {order.currency} {Number(item.unit_price).toFixed(2)}</li>)}
              </ul>
              {transitions[order.status]?.length > 0 && (
                <label className="text-sm text-ink-mute">Change status
                  <select className={inputClass} defaultValue="" disabled={busy} onChange={(event) => {
                    if (event.target.value) void send({ action: "change_order_status", id: order.id, status: event.target.value });
                    event.target.value = "";
                  }}>
                    <option value="">Choose an allowed transition</option>{transitions[order.status].map((next) => <option key={next}>{next}</option>)}
                  </select>
                </label>
              )}
              <OrderNote orderId={order.id} onSave={send} busy={busy} />
              {order.payment_status !== "paid" && order.payment_method === "manual" && <PaymentReview orderId={order.id} onSave={send} busy={busy} />}
            </Card>
          ))}
          {filteredOrders.length === 0 && <p className="text-ink-mute">No orders match these filters.</p>}
        </div>
      </section>
    </div>
  );
}

function ProductEditor({ categories, initial, dualPricingAvailable, digitalFiles, onSave, busy }: {
  categories: Category[]; initial: ProductDraft; dualPricingAvailable: boolean; digitalFiles: DigitalFile[];
  onSave: (values: Payload) => Promise<boolean>; busy: boolean;
}) {
  const [values, setValues] = useState({ ...blankProduct(), ...initial });
  const set = (key: string, value: string | boolean) => setValues((current) => ({ ...current, [key]: value }));
  return (
    <>
      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        void onSave({
          ...values, action: "save_product", price: Number(values.price), stock: Number(values.stock),
          category_id: values.category_id || null,
          price_etb: values.price_etb.trim() ? Number(values.price_etb) : null,
          price_usd: values.price_usd.trim() ? Number(values.price_usd) : null,
        });
      }}>
        <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-2 text-sm font-semibold">Product identity</legend>
          <Input label="Name" value={values.name} onChange={(event) => set("name", event.target.value)} required />
          <Input label="Slug" value={values.slug} onChange={(event) => set("slug", event.target.value)} required pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" />
          <div className="sm:col-span-2"><Textarea label="Description" value={values.description} onChange={(event) => set("description", event.target.value)} /></div>
          <div className="sm:col-span-2"><Input label="Image URL" type="url" value={values.image_url ?? ""} onChange={(event) => set("image_url", event.target.value)} /></div>
        </fieldset>
        <fieldset className="grid gap-4 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
          <legend className="px-2 text-sm font-semibold">Pricing &amp; inventory</legend>
          <Input label="Price" type="number" min="0" step="0.01" value={values.price} onChange={(event) => set("price", event.target.value)} required />
          <Select label="Currency" value={values.currency} onChange={(event) => set("currency", event.target.value)}><option>ETB</option><option>USD</option></Select>
          <Input label="Stock" type="number" min="0" step="1" value={values.stock} onChange={(event) => set("stock", event.target.value)} required />
          {dualPricingAvailable && <>
            <Input label="Price in ETB (optional)" type="number" min="0" step="0.01" value={values.price_etb} onChange={(event) => set("price_etb", event.target.value)} hint="Enter both currency prices to display dual pricing." />
            <Input label="Price in USD (optional)" type="number" min="0" step="0.01" value={values.price_usd} onChange={(event) => set("price_usd", event.target.value)} hint="Leave both blank to keep the current single price." />
          </>}
          <Select label="Category" value={values.category_id ?? ""} onChange={(event) => set("category_id", event.target.value)}>
            <option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <Select label="Product type" value={values.product_type} onChange={(event) => set("product_type", event.target.value)}><option value="physical">Physical</option><option value="digital">Digital</option></Select>
        </fieldset>
        <fieldset className="grid gap-3 rounded-xl border border-line p-4 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
          <legend className="px-2 text-sm font-semibold">Visibility</legend>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={values.is_demo} onChange={(event) => set("is_demo", event.target.checked)} /> Demo product</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={values.is_published} onChange={(event) => set("is_published", event.target.checked)} /> Active / published</label>
          <Button type="submit" loading={busy}>{values.id ? "Save product" : "Create product"}</Button>
        </fieldset>
      </form>
      {values.id && values.product_type === "digital" && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <p className="text-sm text-ink-mute">Upload the file to the private digital-files bucket separately, then save its relative storage path here.</p>
          {digitalFiles.map((file) => <DigitalFileEditor key={file.id} productId={values.id} file={file} onSave={onSave} busy={busy} />)}
          <DigitalFileEditor productId={values.id} onSave={onSave} busy={busy} />
        </div>
      )}
    </>
  );
}

function DigitalFileEditor({ productId, file, onSave, busy }: {
  productId: string; file?: DigitalFile; onSave: (values: Payload) => Promise<boolean>; busy: boolean;
}) {
  const [fileName, setFileName] = useState(file?.file_name ?? "");
  const [storagePath, setStoragePath] = useState(file?.storage_path ?? "");
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "save_digital_file", id: file?.id ?? null, product_id: productId, file_name: fileName, storage_path: storagePath });
    }}>
      <Input label="File name shown to customer" value={fileName} maxLength={255} onChange={(event) => setFileName(event.target.value)} required />
      <Input label="Private storage path" value={storagePath} maxLength={500} onChange={(event) => setStoragePath(event.target.value)} placeholder="products/example/file.zip" required />
      <Button type="submit" variant="secondary" loading={busy}>{file ? "Update file reference" : "Attach file reference"}</Button>
    </form>
  );
}

function CategoryEditor({ initial, onSave, busy }: { initial: { id: string; name: string; slug: string }; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [name, setName] = useState(initial.name);
  const [slug, setSlug] = useState(initial.slug);
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "save_category", id: initial.id || null, name, slug });
    }}>
      <Input label="Category name" value={name} onChange={(event) => setName(event.target.value)} required />
      <Input label="Slug" value={slug} onChange={(event) => setSlug(event.target.value)} required pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" />
      <Button type="submit" loading={busy}>{initial.id ? "Update" : "Create category"}</Button>
    </form>
  );
}

function VariantStock({ variant, productId, onSave, busy }: { variant: Variant; productId: string; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [stock, setStock] = useState(String(variant.stock ?? 0));
  return (
    <form className="grid gap-2 sm:grid-cols-[1fr_10rem_auto] sm:items-end" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "save_variant_stock", id: variant.id, product_id: productId, stock: Number(stock) });
    }}>
      <p>{variant.label} {Number(stock) <= 5 && <span className="text-amber-300">(low stock)</span>}</p>
      <Input label="Variant stock" type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} />
      <Button type="submit" variant="secondary" loading={busy}>Update stock</Button>
    </form>
  );
}

function OrderNote({ orderId, onSave, busy }: { orderId: string; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [note, setNote] = useState("");
  return (
    <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "add_order_note", id: orderId, note }).then((ok) => { if (ok) setNote(""); });
    }}>
      <Input label="Admin note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} required />
      <Button type="submit" variant="secondary" loading={busy}>Add note</Button>
    </form>
  );
}

function PaymentReview({ orderId, onSave, busy }: { orderId: string; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("verified");
  return (
    <form className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "review_payment", id: orderId, status, reference, note });
    }}>
      <Input label="Payment reference" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={200} />
      <Input label="Review note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} />
      <Select label="Decision" value={status} onChange={(event) => setStatus(event.target.value)}><option value="verified">Verify payment</option><option value="rejected">Reject payment</option></Select>
      <Button type="submit" loading={busy}>Save payment review</Button>
    </form>
  );
}

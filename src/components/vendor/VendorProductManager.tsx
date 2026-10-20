"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";

type Category = { id: number; name: string };
type Product = {
  id: string; name: string; slug: string; description: string; price: number | string; currency: string;
  price_etb: number | string | null; price_usd: number | string | null; stock: number;
  category_id: number | null; approval_status: string; created_at: string;
};
type Values = {
  name: string; slug: string; description: string; price: string; currency: string;
  price_etb: string; price_usd: string; stock: string; category_id: string;
};
const blank = (): Values => ({ name: "", slug: "", description: "", price: "", currency: "ETB", price_etb: "", price_usd: "", stock: "0", category_id: "" });
const statusCopy: Record<string, string> = {
  draft: "Not submitted. You can edit, submit for approval, or delete this draft.",
  pending: "Waiting for admin review.",
  approved: "Approved by admin. Publishing is done by admin.",
  rejected: "Rejected. Edit the product and resubmit for approval.",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
function productValues(product: Product): Values {
  return {
    name: product.name, slug: product.slug, description: product.description ?? "",
    price: String(product.price), currency: product.currency,
    price_etb: product.price_etb == null ? "" : String(product.price_etb),
    price_usd: product.price_usd == null ? "" : String(product.price_usd),
    stock: String(product.stock), category_id: product.category_id == null ? "" : String(product.category_id),
  };
}

export function VendorProductManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(blank);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(key: keyof Values, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  }
  function edit(product: Product) {
    setEditingId(product.id);
    setValues(productValues(product));
    setSlugTouched(true);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function cancelEdit() {
    setEditingId(null);
    setValues(blank());
    setSlugTouched(false);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/vendor/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          name: values.name, slug: values.slug, description: values.description,
          price: values.price, currency: values.currency,
          price_etb: values.price_etb || null, price_usd: values.price_usd || null,
          stock: values.stock, category_id: values.category_id ? Number(values.category_id) : null,
        }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Product could not be saved."); return; }
      setMessage(result.message ?? "Product saved.");
      cancelEdit();
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(product: Product) {
    setBusyId(product.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/vendor/products", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, action: "submit" }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Product could not be submitted."); return; }
      setMessage(result.message ?? "Product submitted for approval.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    setBusyId(product.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/vendor/products", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Product could not be deleted."); return; }
      setMessage(result.message ?? "Product deleted.");
      if (editingId === product.id) cancelEdit();
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-red-300">{error}</p>}
      {message && <p role="status" className="rounded-xl border border-cyan/30 p-3 text-cyan-soft">{message}</p>}
      <Card>
        <h2 className="text-lg font-semibold">{editingId ? "Edit vendor product" : "Create vendor product"}</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => void save(event)}>
          <Input label="Name" value={values.name} maxLength={120} onChange={(event) => update("name", event.target.value)} required />
          <Input label="Slug" value={values.slug} maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" onChange={(event) => { setSlugTouched(true); update("slug", event.target.value); }} required />
          <Textarea label="Description" value={values.description} maxLength={5000} onChange={(event) => update("description", event.target.value)} />
          <Input label="Price" type="number" min="0" max="1000000000000" step="0.01" value={values.price} onChange={(event) => update("price", event.target.value)} required />
          <Select label="Currency" value={values.currency} onChange={(event) => update("currency", event.target.value)}><option value="ETB">ETB</option><option value="USD">USD</option></Select>
          <Input label="Price in ETB (optional)" type="number" min="0" max="9999999999.99" step="0.01" value={values.price_etb} onChange={(event) => update("price_etb", event.target.value)} hint="Enter both dual prices or leave both blank." />
          <Input label="Price in USD (optional)" type="number" min="0" max="9999999999.99" step="0.01" value={values.price_usd} onChange={(event) => update("price_usd", event.target.value)} hint="Enter both dual prices or leave both blank." />
          <Input label="Stock" type="number" min="0" max="1000000000" step="1" value={values.stock} onChange={(event) => update("stock", event.target.value)} required />
          <Select label="Category" value={values.category_id} onChange={(event) => update("category_id", event.target.value)}>
            <option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <Button type="submit" loading={busy} disabled={busy || busyId !== null}>{editingId ? "Save draft" : "Create draft"}</Button>
            {editingId && <Button type="button" variant="secondary" disabled={busy} onClick={cancelEdit}>Cancel edit</Button>}
          </div>
        </form>
      </Card>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Your products</h2>
        {products.map((product) => {
          const editable = product.approval_status === "draft" || product.approval_status === "rejected";
          return <Card key={product.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-ink-mute">/{product.slug} · ETB {product.price_etb ?? "—"} · USD {product.price_usd ?? "—"} · Stock {product.stock}</p>
                <p className="mt-1 text-sm capitalize">Status: {product.approval_status}</p>
                <p className="mt-1 text-sm text-ink-mute">{statusCopy[product.approval_status] ?? "Status information is unavailable."}</p>
              </div>
              {editable && <div className="flex flex-wrap gap-2">
                <Button variant="secondary" disabled={busy || busyId !== null} onClick={() => edit(product)}>Edit</Button>
                <Button variant="secondary" disabled={busy || busyId !== null} loading={busyId === product.id} onClick={() => void submit(product)}>Submit for approval</Button>
                <Button variant="ghost" disabled={busy || busyId !== null} onClick={() => void remove(product)}>Delete</Button>
              </div>}
            </div>
          </Card>;
        })}
        {products.length === 0 && <Card><p className="text-ink-mute">You have not created any products yet.</p></Card>}
      </section>
    </div>
  );
}

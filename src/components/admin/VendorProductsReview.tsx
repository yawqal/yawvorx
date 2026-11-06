"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type VendorProduct = {
  id: string;
  vendor_id: string | null;
  vendor_name: string;
  name: string;
  slug: string;
  price_etb: number | null;
  price_usd: number | null;
  stock: number;
  approval_status: string;
  created_at: string;
};

export function VendorProductsReview({ products }: { products: VendorProduct[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function review(product: VendorProduct, action: "approve" | "reject") {
    setBusyId(product.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/vendor-products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, action }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Product review failed."); return; }
      setMessage(result.message ?? "Product review saved.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }
  return (
    <div className="space-y-4">
      {error && <p role="alert" className="rounded-xl border border-red-400/40 p-3 text-red-300">{error}</p>}
      {message && <p role="status" className="text-secondary-soft">{message}</p>}
      {products.map((product) => <Card key={product.id}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{product.name}</h2>
            <p className="text-sm text-ink-mute">/{product.slug} · Vendor: {product.vendor_name}</p>
            <p className="mt-2 text-sm">ETB {product.price_etb ?? "—"} · USD {product.price_usd ?? "—"} · Stock {product.stock}</p>
            <p className="mt-1 text-sm capitalize text-ink-mute">Status: {product.approval_status} · Submitted {new Date(product.created_at).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" disabled={busyId !== null} loading={busyId === product.id} onClick={() => void review(product, "approve")}>Approve</Button>
            <Button variant="secondary" disabled={busyId !== null} onClick={() => void review(product, "reject")}>Reject</Button>
          </div>
        </div>
      </Card>)}
      {products.length === 0 && <Card><p className="text-ink-mute">No vendor products found.</p></Card>}
    </div>
  );
}

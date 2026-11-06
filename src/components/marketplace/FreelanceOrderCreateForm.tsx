"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function FreelanceOrderCreateForm({ serviceId }: { serviceId: string; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch("/api/freelance-orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service_id: serviceId, details: values.details, deadline: values.deadline || null }),
      });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) { setError(result.error ?? "Order could not be created."); return; }
      setMessage("Order created. Opening order details…");
      router.push(`/freelance-orders/${encodeURIComponent(result.id)}`);
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return <form className="mt-3 grid gap-4" onSubmit={submit}>
    <Textarea label="Project details" name="details" minLength={10} maxLength={4000} required />
    <Input label="Desired deadline (optional)" name="deadline" type="date" min={today} />
    <p className="rounded-xl border border-amber-700/20 bg-amber-500/10 p-4 text-sm text-amber-200">Payments for freelancer orders are not processed on ZIKA yet. Agree payment terms directly with the freelancer.</p>
    <p role="status" aria-live="polite" className="min-h-5 text-sm text-secondary-soft">{message}</p>
    <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-300">{error}</p>
    <Button type="submit" loading={busy}>Place order</Button>
  </form>;
}

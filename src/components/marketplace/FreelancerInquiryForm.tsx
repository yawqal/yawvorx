"use client";

import { useState } from "react";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function FreelancerInquiryForm({ profileId }: { profileId: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/freelancers/inquiry", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, profile_id: profileId }),
      });
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        setError(`Unexpected server response (status ${response.status}).`);
        return;
      }
      const payload = result && typeof result === "object" ? result as { error?: unknown; message?: unknown } : {};
      if (!response.ok) {
        setError(typeof payload.error === "string" && payload.error ? payload.error : "Inquiry could not be sent.");
        return;
      }
      event.currentTarget.reset();
      setMessage(typeof payload.message === "string" ? payload.message : "Your inquiry was sent.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally { setBusy(false); }
  }
  return <Card>
    <form className="grid gap-4" onSubmit={submit}>
      <Input label="Name" name="name" autoComplete="name" maxLength={100} required />
      <Input label="Email" name="email" type="email" autoComplete="email" maxLength={254} required />
      <Textarea label="Project message" name="message" minLength={10} maxLength={2000} required />
      <Input label="Budget (ETB or range)" name="budget" maxLength={120} />
      <Input label="Desired deadline" name="deadline" type="date" />
      <p role="status" aria-live="polite" className="text-sm text-cyan-soft">{message}</p>
      <p role="alert" aria-live="polite" className="text-sm text-red-300">{error}</p>
      <Button type="submit" loading={busy}>Send inquiry</Button>
    </form>
  </Card>;
}

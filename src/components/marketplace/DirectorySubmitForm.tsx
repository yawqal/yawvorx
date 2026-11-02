"use client";
import { useState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const categories = ["Technology", "Retail", "Food & Beverage", "Professional Services", "Health & Wellness", "Education", "Other"];
export function DirectorySubmitForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/api/directory/submit", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Business could not be submitted."); return; }
      setMessage(result.message ?? "Business submitted for review."); form.reset();
    } catch { setError("Could not reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <Card><form className="grid gap-4" onSubmit={submit}>
    <Input label="Business name" name="name" maxLength={100} required />
    <Select label="Category" name="category" required defaultValue=""><option value="" disabled>Select category</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select>
    <Textarea label="Description" name="description" minLength={10} maxLength={2000} required />
    <Input label="City" name="city" maxLength={80} required />
    <Input label="Website (https:// required)" name="website" type="url" maxLength={2048} required />
    <Input label="Public email (optional)" name="public_email" type="email" maxLength={254} />
    <Input label="Public phone (optional)" name="public_phone" type="tel" maxLength={30} />
    <p role="status" aria-live="polite" className="text-sm text-secondary-soft">{message}</p>
    <p role="alert" aria-live="polite" className="text-sm text-red-300">{error}</p>
    <Button type="submit" loading={busy}>Submit business for review</Button>
  </form></Card>;
}

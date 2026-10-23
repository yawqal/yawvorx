"use client";

import { useState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const tiers = ["basic", "standard", "premium"] as const;
export function FreelancerApplyForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const packages = tiers.map((tier) => ({
      tier,
      price_etb: values[`${tier}_price`],
      delivery_days: values[`${tier}_days`],
      revisions: values[`${tier}_revisions`],
      description: values[`${tier}_description`],
    })).filter((item) => String(item.price_etb ?? "").trim() !== "");
    try {
      const response = await fetch("/api/freelancers/apply", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, packages }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Application could not be submitted."); return; }
      setMessage(result.message ?? "Application submitted for review.");
      form.reset();
    } catch { setError("Could not reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  return <Card><form className="grid gap-5" onSubmit={submit}>
    <Input label="Display name" name="display_name" maxLength={80} required />
    <Input label="Headline" name="headline" maxLength={120} required />
    <Textarea label="Biography" name="bio" minLength={10} maxLength={2000} required />
    <Select label="Category" name="category" required defaultValue=""><option value="" disabled>Select a category</option>
      {["Design", "Development", "Writing", "Marketing", "Video", "Other"].map((item) => <option key={item}>{item}</option>)}
    </Select>
    <Input label="Skills (comma-separated, up to 10)" name="skills" maxLength={500} required />
    <Select label="Availability" name="availability" required defaultValue=""><option value="" disabled>Select availability</option>
      <option value="available">Available</option><option value="limited">Limited availability</option><option value="unavailable">Unavailable</option>
    </Select>
    <fieldset className="grid gap-4"><legend className="text-xl font-semibold">Packages (optional)</legend>
      {tiers.map((tier) => <div key={tier} className="grid min-w-0 gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
        <h3 className="capitalize sm:col-span-2 font-semibold">{tier}</h3>
        <Input label={`${tier} price (ETB)`} name={`${tier}_price`} type="number" min="0" step="0.01" />
        <Input label={`${tier} delivery days`} name={`${tier}_days`} type="number" min="1" max="365" />
        <Input label={`${tier} revisions`} name={`${tier}_revisions`} type="number" min="0" max="100" />
        <Input label={`${tier} description`} name={`${tier}_description`} maxLength={500} />
      </div>)}
    </fieldset>
    <p role="status" aria-live="polite" className="text-sm text-cyan-soft">{message}</p>
    <p role="alert" aria-live="polite" className="text-sm text-red-300">{error}</p>
    <Button type="submit" loading={busy}>Submit profile for review</Button>
  </form></Card>;
}

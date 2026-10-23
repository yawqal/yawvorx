"use client";

import { useState } from "react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Package = {
  tier: string;
  title: string;
  description: string;
  price_etb: number | string;
  delivery_days: number;
  revisions: number;
  is_active: boolean;
};

const tiers = ["basic", "standard", "premium"] as const;

export function FreelancerManageForm({
  profile,
  packages,
}: {
  profile: {
    display_name: string;
    headline: string | null;
    bio: string | null;
    category: string;
    skills: string[] | string | null;
    availability: string | null;
    starting_price_etb: number | string | null;
  };
  packages: Package[];
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const skills = Array.isArray(profile.skills) ? profile.skills.join(", ") : profile.skills ?? "";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    const packageValues = tiers.map((tier) => ({
      tier,
      title: values[`${tier}_title`],
      description: values[`${tier}_description`],
      price_etb: values[`${tier}_price_etb`],
      delivery_days: values[`${tier}_delivery_days`],
      revisions: values[`${tier}_revisions`],
      is_active: values[`${tier}_is_active`] === "true",
    }));
    try {
      const response = await fetch("/api/freelancers/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, packages: packageValues }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) {
        setError(result.error ?? "Profile could not be updated.");
        return;
      }
      setMessage(result.message ?? "Profile updated successfully.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <form className="grid min-w-0 gap-5" onSubmit={submit}>
        <Input label="Display name" name="display_name" defaultValue={profile.display_name} maxLength={80} required />
        <Input label="Headline" name="headline" defaultValue={profile.headline ?? ""} maxLength={120} required />
        <Textarea label="Biography" name="bio" defaultValue={profile.bio ?? ""} minLength={10} maxLength={2000} required />
        <Select label="Category" name="category" defaultValue={profile.category} required>
          {["Design", "Development", "Writing", "Marketing", "Video", "Other"].map((category) => <option key={category}>{category}</option>)}
        </Select>
        <Input label="Skills (comma-separated, up to 10)" name="skills" defaultValue={skills} maxLength={500} required />
        <Select label="Availability" name="availability" defaultValue={profile.availability ?? "available"} required>
          <option value="available">Available</option><option value="limited">Limited availability</option><option value="unavailable">Unavailable</option>
        </Select>
        <Input label="Starting price (ETB, optional)" name="starting_price_etb" type="number" min="0" step="0.01" defaultValue={profile.starting_price_etb ?? ""} />
        <fieldset className="grid min-w-0 gap-4">
          <legend className="text-xl font-semibold">Packages</legend>
          {tiers.map((tier) => {
            const item = packages.find((pkg) => pkg.tier.toLowerCase() === tier);
            return <div key={tier} className="grid min-w-0 gap-3 rounded-xl border border-line p-4 sm:grid-cols-2">
              <h3 className="font-semibold capitalize sm:col-span-2">{tier}</h3>
              <Input label={`${tier} title`} name={`${tier}_title`} defaultValue={item?.title ?? ""} maxLength={100} />
              <Input label={`${tier} description`} name={`${tier}_description`} defaultValue={item?.description ?? ""} maxLength={1000} />
              <Input label={`${tier} price (ETB)`} name={`${tier}_price_etb`} type="number" min="0" step="0.01" defaultValue={item?.price_etb ?? ""} />
              <Input label={`${tier} delivery days`} name={`${tier}_delivery_days`} type="number" min="1" max="365" defaultValue={item?.delivery_days ?? ""} />
              <Input label={`${tier} revisions`} name={`${tier}_revisions`} type="number" min="0" max="100" defaultValue={item?.revisions ?? ""} />
              <Select label={`${tier} package status`} name={`${tier}_is_active`} defaultValue={String(item?.is_active ?? false)}>
                <option value="true">Active</option><option value="false">Inactive</option>
              </Select>
            </div>;
          })}
        </fieldset>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-cyan-soft">{message}</p>
        <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-300">{error}</p>
        <Button type="submit" loading={busy}>Save profile</Button>
      </form>
    </Card>
  );
}

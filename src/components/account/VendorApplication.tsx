"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";

type Application = {
  business_name: string;
  contact_value: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  referral_code: string | null;
};

export function VendorApplication({
  application,
  activeReferralCode,
  referralTrackingAvailable,
}: {
  application: Application | null;
  activeReferralCode: string | null;
  referralTrackingAvailable: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: form.get("business_name"),
          contact_value: form.get("contact_value"),
          description: form.get("description"),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "The application could not be sent.");
        return;
      }
      setMessage("Application submitted for owner review.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      {application ? <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">{application.business_name}</h3>
          <span className="rounded-lg border border-line px-3 py-1 text-sm capitalize">{application.status}</span>
        </div>
        <p className="mt-2 text-sm text-ink-mute">{application.description}</p>
        {application.admin_note && <p className="mt-3 text-sm text-ink-mute">Owner note: {application.admin_note}</p>}
        {application.status === "approved" && activeReferralCode && (
          <div className="mt-4 rounded-xl border border-brand/30 p-4">
            <p className="text-sm text-ink-mute">Your referral code</p>
            <code className="mt-1 block text-lg font-semibold text-secondary-soft">{activeReferralCode}</code>
            <p className="mt-2 break-all text-sm text-ink-mute">/?ref={activeReferralCode}</p>
          </div>
        )}
        {application.status === "approved" && !activeReferralCode && (
          <p className="mt-3 text-sm text-amber-300">{referralTrackingAvailable
            ? "Your referral code is still being prepared. Contact the owner if this continues."
            : "Referral tracking setup is incomplete. Contact the owner."}</p>
        )}
      </> : <form onSubmit={submit} className="space-y-3">
        <h3 className="font-semibold">Apply to become a vendor</h3>
        <Input label="Business name" name="business_name" minLength={2} maxLength={120} required />
        <Input label="Contact detail" name="contact_value" minLength={3} maxLength={150} required />
        <Textarea label="Tell us about your business and products" name="description" minLength={20} maxLength={2000} required />
        {message && <p role="status" className="text-sm text-secondary-soft">{message}</p>}
        <Button type="submit" loading={busy}>Submit application</Button>
      </form>}
      {application && message && <p role="status" className="mt-3 text-sm text-secondary-soft">{message}</p>}
    </Card>
  );
}

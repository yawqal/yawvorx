"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Settings = {
  vendor_commission_pct: number | null;
  affiliate_commission_pct: number | null;
  payable_after_days: number;
  referral_cookie_days: number;
  min_payout_etb: number | null;
};
const inputClass = "mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink";

export function MarketplaceSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState({
    vendor_commission_pct: settings.vendor_commission_pct?.toString() ?? "",
    affiliate_commission_pct: settings.affiliate_commission_pct?.toString() ?? "",
    payable_after_days: settings.payable_after_days.toString(),
    referral_cookie_days: settings.referral_cookie_days.toString(),
    min_payout_etb: settings.min_payout_etb?.toString() ?? "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function set(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/marketplace-settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_commission_pct: values.vendor_commission_pct === "" ? null : Number(values.vendor_commission_pct),
          affiliate_commission_pct: values.affiliate_commission_pct === "" ? null : Number(values.affiliate_commission_pct),
          payable_after_days: Number(values.payable_after_days),
          referral_cookie_days: Number(values.referral_cookie_days),
          min_payout_etb: values.min_payout_etb === "" ? null : Number(values.min_payout_etb),
        }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) { setError(result.error ?? "Marketplace settings could not be saved."); return; }
      setMessage(result.message ?? "Marketplace settings saved.");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <form className="space-y-5" onSubmit={(event) => void save(event)}>
        <p className="text-sm text-ink-mute">Current saved values are shown below. Leave commission or minimum payout blank to save null.</p>
        <label className="block text-sm text-ink-mute">Vendor commission (%)<input className={inputClass} type="number" min="0" max="100" step="0.01" value={values.vendor_commission_pct} onChange={(event) => set("vendor_commission_pct", event.target.value)} /></label>
        <label className="block text-sm text-ink-mute">Affiliate commission (%)<input className={inputClass} type="number" min="0" max="100" step="0.01" value={values.affiliate_commission_pct} onChange={(event) => set("affiliate_commission_pct", event.target.value)} /></label>
        <label className="block text-sm text-ink-mute">Days until commission is payable<input className={inputClass} type="number" min="0" max="365" step="1" value={values.payable_after_days} onChange={(event) => set("payable_after_days", event.target.value)} required /></label>
        <label className="block text-sm text-ink-mute">Referral cookie days<input className={inputClass} type="number" min="1" max="365" step="1" value={values.referral_cookie_days} onChange={(event) => set("referral_cookie_days", event.target.value)} required /></label>
        <label className="block text-sm text-ink-mute">Minimum payout (ETB)<input className={inputClass} type="number" min="0" step="0.01" value={values.min_payout_etb} onChange={(event) => set("min_payout_etb", event.target.value)} /></label>
        {error && <p role="alert" className="text-red-300">{error}</p>}
        {message && <p role="status" className="text-cyan-soft">{message}</p>}
        <Button type="submit" loading={busy} disabled={busy}>Save settings</Button>
      </form>
    </Card>
  );
}

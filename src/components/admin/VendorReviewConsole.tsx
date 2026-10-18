"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Application = {
  id: string;
  user_id: string;
  business_name: string;
  contact_value: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  referral_code: string | null;
  created_at: string;
};
type Referral = { code: string; is_active: boolean; clicks: number; signups: number };

export function VendorReviewConsole({
  applications,
  referrals,
}: {
  applications: Application[];
  referrals: Map<string, Referral>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, Application["status"]>>({});

  async function review(application: Application) {
    setBusyId(application.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "review_vendor",
          id: application.id,
          status: statuses[application.id] ?? application.status,
        }),
      });
      const result = await response.json() as { error?: string; warning?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Application review failed.");
        return;
      }
      setMessage(result.warning ?? "Application status updated.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && <p role="status" className="text-cyan-soft">{message}</p>}
      {applications.map((application) => {
        const referral = application.referral_code ? referrals.get(application.referral_code) : undefined;
        return <Card key={application.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{application.business_name}</h2>
              <p className="text-xs text-ink-mute">User: {application.user_id} · Applied {new Date(application.created_at).toLocaleDateString()}</p>
            </div>
            <span className="rounded-lg border border-line px-3 py-1 text-sm capitalize">{application.status}</span>
          </div>
          <p className="mt-3 text-sm">Contact: {application.contact_value}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-mute">{application.description}</p>
          {referral && <div className="mt-4 rounded-xl border border-line p-3 text-sm">
            <p>Referral code: <code>{referral.code}</code> {referral.is_active ? "(active)" : "(inactive)"}</p>
            <p className="mt-1 text-ink-mute">Recorded clicks: {referral.clicks} · Recorded signups: {referral.signups}</p>
            <p className="mt-1 text-xs text-amber-300">Signup attribution is not connected to the protected registration flow.</p>
          </div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="text-sm text-ink-mute">Review status
              <select
                className="mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink"
                value={statuses[application.id] ?? application.status}
                onChange={(event) => setStatuses((current) => ({ ...current, [application.id]: event.target.value as Application["status"] }))}
              >
                <option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
              </select>
            </label>
            <Button variant="secondary" disabled={busyId !== null} loading={busyId === application.id} onClick={() => void review(application)}>Save review</Button>
          </div>
        </Card>;
      })}
      {applications.length === 0 && <Card><p className="text-ink-mute">No vendor applications yet.</p></Card>}
    </div>
  );
}

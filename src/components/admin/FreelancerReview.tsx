"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Profile = { id: string; display_name: string; slug: string; category: string; status: string; is_verified: boolean | null; created_at: string };
export function FreelancerReview({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function update(profile: Profile, action: "approve" | "reject" | "verify" | "unverify") {
    setBusy(profile.id); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/freelancers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: profile.id, action }),
      });
      const result = await response.json() as { error?: string; message?: string; auditWarning?: boolean };
      if (!response.ok) { setError(result.error ?? "Freelancer update failed."); return; }
      setMessage(`${result.message ?? "Freelancer update saved."}${result.auditWarning ? " Audit logging needs attention." : ""}`);
      router.refresh();
    } catch { setError("Could not reach the server. Check your connection and try again."); }
    finally { setBusy(null); }
  }
  return <div className="space-y-4">
    <p role="status" aria-live="polite" className="text-cyan-soft">{message}</p>
    <p role="alert" aria-live="polite" className="text-red-300">{error}</p>
    {profiles.map((profile) => <Card key={profile.id}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge>{profile.status}</Badge><Badge>{profile.category}</Badge>{profile.is_verified === true && <Badge tone="ok">Verified</Badge>}</div>
          <h2 className="mt-3 break-words font-semibold">{profile.display_name}</h2><p className="break-all text-sm text-ink-mute">/{profile.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.status === "pending" && <>
            <Button variant="secondary" disabled={busy !== null} loading={busy === profile.id} onClick={() => void update(profile, "approve")}>Approve</Button>
            <Button variant="secondary" disabled={busy !== null} onClick={() => void update(profile, "reject")}>Reject</Button>
          </>}
          <Button variant="secondary" disabled={busy !== null} onClick={() => void update(profile, profile.is_verified ? "unverify" : "verify")}>{profile.is_verified ? "Remove verification" : "Verify"}</Button>
        </div>
      </div>
    </Card>)}
    {profiles.length === 0 && <Card><p className="text-ink-mute">No pending freelancer profiles yet.</p></Card>}
  </div>;
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Business = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  city: string;
  website: string;
  public_email: string;
  public_phone: string;
  status: string;
  created_at: string
};

interface DirectoryReviewProps {
  businesses: Business[];
  onUpdate?: (business: Business, action: "approve" | "reject") => Promise<void>;
}

export function DirectoryReview({ businesses, onUpdate }: DirectoryReviewProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function updateStatus(business: Business, action: "approve" | "reject") {
    setBusy(business.id);
    setMessage("");
    setError("");
    try {
      if (onUpdate) {
        await onUpdate(business, action);
      } else {
        // fallback: direct fetch
        const response = await fetch("/api/admin/directory", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: business.id,
            status: action === "approve" ? "approved" : "rejected"
          }),
        });
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error ?? "Business update failed.");
        }
      }
      setMessage(`Business ${action === "approve" ? "approved" : "rejected"}.`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <p role="status" aria-live="polite" className="text-cyan-soft">{message}</p>
      <p role="alert" aria-live="polite" className="text-red-300">{error}</p>
      {businesses.map((biz) => (
        <Card key={biz.id}>
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge>{biz.category}</Badge>
                <Badge>{biz.status}</Badge>
              </div>
              <h2 className="mt-3 break-words font-semibold">{biz.name}</h2>
              <p className="break-all text-sm text-ink-mute">/{biz.slug}</p>
              {biz.description && (
                <p className="mt-1 text-sm text-ink-mute">{biz.description.slice(0, 100)}{biz.description.length > 100 ? "…" : ""}</p>
              )}
              <p className="mt-1 text-sm text-ink-mute">
                {biz.city}{biz.website ? ` • <a href={biz.website} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Website</a>` : ""}
              </p>
              <p className="mt-1 text-sm text-ink-mute">
                Email: {biz.public_email}{biz.public_phone ? ` • Phone: {biz.public_phone}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {biz.status === "pending" && (
                <>
                  <Button
                    variant="secondary"
                    disabled={busy !== null}
                    loading={busy === biz.id}
                    onClick={() => void updateStatus(biz, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy !== null}
                    onClick={() => void updateStatus(biz, "reject")}
                  >
                  Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
      {businesses.length === 0 && (
        <Card>
          <p className="text-ink-mute">No businesses yet.</p>
        </Card>
      )}
    </div>
  );
}
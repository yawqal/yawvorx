"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Review = {
  id: string;
  rating: number;
  body: string;
  is_hidden: boolean;
  created_at: string;
  products: { name: string; slug: string } | { name: string; slug: string }[] | null;
};

export function ReviewsModeration({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function setHidden(review: Review) {
    setBusyId(review.id);
    setMessage("");
    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "moderate_review", id: review.id, is_hidden: !review.is_hidden }),
      });
      const result = await response.json() as { error?: string; warning?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Review moderation failed.");
        return;
      }
      setMessage(result.warning ?? "Review updated.");
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
      {reviews.map((review) => {
        const product = Array.isArray(review.products) ? review.products[0] : review.products;
        return <Card key={review.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">{product?.name ?? "Deleted product"} · {review.rating}/5</h2>
              <p className="text-xs text-ink-mute">Review ID: {review.id} · {new Date(review.created_at).toLocaleString()}</p>
            </div>
            <Button variant="secondary" disabled={busyId !== null} loading={busyId === review.id} onClick={() => void setHidden(review)}>
              {review.is_hidden ? "Restore review" : "Hide review"}
            </Button>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-ink-mute">{review.body}</p>
          <p className="mt-2 text-xs">{review.is_hidden ? "Hidden" : "Visible"}</p>
        </Card>;
      })}
      {reviews.length === 0 && <Card><p className="text-ink-mute">No customer reviews yet.</p></Card>}
    </div>
  );
}

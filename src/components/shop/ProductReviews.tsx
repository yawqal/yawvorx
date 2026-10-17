"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

type Review = { id: string; rating: number; body: string; created_at: string };

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  average,
  signedIn,
}: {
  productId: string;
  productSlug: string;
  reviews: Review[];
  average: number | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [rating, setRating] = useState("5");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating: Number(rating), body }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "Your review could not be saved.");
        return;
      }
      setBody("");
      setMessage("Thank you. Your verified-purchase review is now visible.");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-14 border-t border-line pt-8">
      <h2 className="text-2xl font-semibold">Customer reviews</h2>
      <p className="mt-2 text-sm text-ink-mute" aria-live="polite">
        {average === null ? "No reviews yet." : `${average.toFixed(1)} out of 5 · ${reviews.length} verified-purchase review${reviews.length === 1 ? "" : "s"}`}
      </p>
      <div className="mt-5 space-y-3">
        {reviews.map((review) => <article key={review.id} className="surface p-4">
          <div className="flex items-center justify-between gap-3">
            <p aria-label={`${review.rating} out of 5 stars`} className="text-amber-300">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</p>
            <time className="text-xs text-ink-mute" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
          </div>
          <p className="mt-2 whitespace-pre-wrap text-ink-mute">{review.body}</p>
        </article>)}
      </div>
      {!signedIn ? <p className="mt-6 text-sm text-ink-mute"><Link className="text-cyan-soft underline" href={`/login?next=${encodeURIComponent(`/shop/${productSlug}`)}`}>Sign in</Link> to review after a verified paid purchase.</p>
        : <form onSubmit={submit} className="mt-6 max-w-2xl space-y-3">
            <label className="block text-sm text-ink-mute">Rating
              <select value={rating} onChange={(event) => setRating(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink">
                {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} out of 5</option>)}
              </select>
            </label>
            <Textarea label="Your review" value={body} onChange={(event) => setBody(event.target.value)} minLength={10} maxLength={2000} required />
            <p className="text-xs text-ink-mute">Reviews are accepted only when Supabase confirms a paid order containing this product.</p>
            {message && <p role="status" className="text-sm text-cyan-soft">{message}</p>}
            <Button type="submit" loading={busy}>Submit review</Button>
          </form>}
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea, Select } from "@/components/ui/Field";

type Status = "pending" | "accepted" | "declined" | "in_progress" | "submitted" | "revision_requested" | "completed" | "cancelled";
type Message = { id: string; sender_id: string; body: string; created_at: string };
type Review = { rating: number; comment: string | null; created_at: string } | null;
const labels: Record<string, string> = {
  accepted: "Accept", declined: "Decline", in_progress: "Start work", submitted: "Mark as submitted",
  cancelled: "Cancel order", revision_requested: "Request revision", completed: "Approve and complete",
};
const notice = "Payments for freelancer orders are not processed on ZIKA yet. Agree payment terms directly with the freelancer.";

export function FreelanceOrderActions({ orderId, userId, freelancerUserId, status, messages, review }: {
  orderId: string; userId: string; freelancerUserId: string; status: Status; messages: Message[]; review: Review;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const freelancer = userId === freelancerUserId;
  const terminal = ["declined", "cancelled", "completed"].includes(status);
  const allowedStatuses: Status[] = freelancer
    ? status === "pending" ? ["accepted", "declined"] : status === "accepted" ? ["in_progress"] : ["in_progress", "revision_requested"].includes(status) ? ["submitted"] : []
    : ["pending", "accepted"].includes(status) ? ["cancelled"] : status === "submitted" ? ["revision_requested", "completed"] : [];

  async function post(path: string, payload: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return false;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/freelance-orders/${encodeURIComponent(orderId)}/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error ?? "The request could not be completed."); return false; }
      setMessage("Updated successfully.");
      router.refresh();
      return true;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      return false;
    } finally { setBusy(false); }
  }

  async function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (await post("messages", { body: messageDraft })) setMessageDraft("");
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await post("review", { rating: Number(values.rating), comment: values.comment ?? "" });
  }

  return <div className="grid gap-6">
    <p className="rounded-xl border border-amber-700/20 bg-amber-500/10 p-4 text-sm text-amber-200">{notice}</p>
    <section aria-labelledby="order-timeline-heading">
      <h2 id="order-timeline-heading" className="text-xl font-semibold">Status timeline</h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-4">
        {["pending", "accepted", "in_progress", "submitted", "completed"].map((step) => (
          <li key={step} className={`rounded-xl border p-3 text-sm ${step === status ? "border-brand text-ink" : "border-line text-ink-mute"}`}>
            <span className="capitalize">{step.replace(/_/g, " ")}</span>{step === status && <span className="ml-2">(current)</span>}
          </li>
        ))}
        {["declined", "revision_requested", "cancelled"].includes(status) && <li className="rounded-xl border border-brand p-3 text-sm capitalize">{status.replace(/_/g, " ")} (current)</li>}
      </ol>
    </section>
    <section className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Messages</h2><Button type="button" variant="secondary" onClick={() => router.refresh()}>Refresh</Button></div>
      {messages.length ? <ol className="mt-3 grid gap-3">{messages.map((item) => <li key={item.id} className="min-w-0 rounded-xl border border-line p-4">
        <div className="flex flex-wrap justify-between gap-2 text-sm text-ink-mute"><span>{item.sender_id === userId ? "You" : freelancer ? "Client" : "Freelancer"}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></div>
        <p className="mt-2 whitespace-pre-wrap break-words">{item.body}</p>
      </li>)}</ol> : <p className="mt-3 text-ink-mute">No messages yet.</p>}
      {!terminal && <form onSubmit={sendMessage} className="mt-4 grid gap-3">
        <Textarea label="Message" value={messageDraft} onChange={(event) => setMessageDraft(event.target.value)} minLength={1} maxLength={2000} required />
        <Button type="submit" loading={busy}>Send message</Button>
      </form>}
    </section>
    {allowedStatuses.length > 0 && <section className="flex flex-wrap gap-3" aria-label="Order actions">
      {allowedStatuses.map((nextStatus) => <Button key={nextStatus} type="button" variant={nextStatus === "declined" || nextStatus === "cancelled" ? "secondary" : "primary"} disabled={busy} onClick={() => void post("status", { status: nextStatus },
        ["declined", "cancelled", "completed"].includes(nextStatus) ? `Are you sure you want to ${labels[nextStatus].toLowerCase()}?` : undefined
      )}>{labels[nextStatus]}</Button>)}
    </section>}
    {status === "completed" && !freelancer && (review ? <section>
      <h2 className="text-xl font-semibold">Your review</h2>
      <p className="mt-2" aria-label={`${review.rating} out of 5 stars`}>{`${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`}</p>
      {review.comment && <p className="mt-2 whitespace-pre-wrap break-words text-ink-mute">{review.comment}</p>}
      <p className="mt-2 text-sm text-ink-mute">Submitted {new Date(review.created_at).toLocaleDateString()}</p>
    </section> : <form onSubmit={submitReview} className="grid gap-3">
      <h2 className="text-xl font-semibold">Review this freelancer</h2>
      <Select label="Rating" name="rating" defaultValue="5" required>
        {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} out of 5</option>)}
      </Select>
      <Textarea label="Comment (optional)" name="comment" maxLength={1000} />
      <Button type="submit" loading={busy}>Submit review</Button>
    </form>)}
    <p role="status" aria-live="polite" className="min-h-5 text-sm text-secondary-soft">{message}</p>
    <p role="alert" aria-live="polite" className="min-h-5 text-sm text-red-300">{error}</p>
  </div>;
}

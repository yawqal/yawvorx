"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Message = { id: string; sender_id: string; body: string; created_at: string };
type Ticket = { id: string; subject: string; status: string; created_at: string; messages: Message[] };

export function SupportTickets({ userId, tickets }: { userId: string; tickets: Ticket[] }) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createTicket(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Support is not configured."); return; }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.id !== userId) { setMessage("Your session expired. Sign in again to contact support."); return; }
    setBusy(true);
    const { data: ticket, error } = await supabase.from("support_tickets")
      .insert({ user_id: userId, subject: subject.trim() }).select("id").single();
    if (error || !ticket) { setBusy(false); setMessage(`Could not create your support ticket: ${error?.message ?? "No ticket was returned."}`); return; }
    const { error: replyError } = await supabase.from("support_messages")
      .insert({ ticket_id: ticket.id, sender_id: userId, body: body.trim() });
    setBusy(false);
    if (replyError) {
      setMessage(`Ticket created, but the first message could not be saved: ${replyError.message}`);
      router.refresh();
      return;
    }
    setSubject("");
    setBody("");
    setMessage("Support ticket created.");
    router.refresh();
  }

  async function reply(ticketId: string) {
    const text = replyDrafts[ticketId]?.trim() ?? "";
    if (!text) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Support is not configured."); return; }
    setBusy(true);
    const { error } = await supabase.from("support_messages").insert({ ticket_id: ticketId, sender_id: userId, body: text });
    setBusy(false);
    if (error) setMessage(`Could not send your reply: ${error.message}`);
    else { setReplyDrafts((current) => ({ ...current, [ticketId]: "" })); setMessage("Reply sent."); router.refresh(); }
  }

  async function close(ticketId: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Support is not configured."); return; }
    setBusy(true);
    const { error } = await supabase.from("support_tickets")
      .update({ status: "closed", closed_at: new Date().toISOString() }).eq("id", ticketId);
    setBusy(false);
    if (error) setMessage(`Could not close the ticket: ${error.message}`);
    else { setMessage("Ticket closed."); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="text-lg font-semibold">Create a support ticket</h3>
        <form className="mt-3 space-y-3" onSubmit={createTicket}>
          <Input label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} minLength={3} maxLength={160} required />
          <Textarea label="Message" value={body} onChange={(event) => setBody(event.target.value)} minLength={1} maxLength={4000} required />
          <Button type="submit" loading={busy}>Create ticket</Button>
        </form>
      </Card>
      {message && <p role="status" className="text-sm text-ink-mute">{message}</p>}
      {tickets.map((ticket) => <Card key={ticket.id}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{ticket.subject}</h3>
          <span className="text-sm capitalize text-secondary-soft">{ticket.status.replace(/_/g, " ")}</span>
        </div>
        <p className="mt-1 text-xs text-ink-mute">Opened {new Date(ticket.created_at).toLocaleString()}</p>
        <ol className="mt-4 space-y-3">
          {ticket.messages.map((reply) => <li key={reply.id} className="rounded-xl border border-line p-3">
            <p className="text-xs text-ink-mute">{reply.sender_id === userId ? "You" : "Support"} · {new Date(reply.created_at).toLocaleString()}</p>
            <p className="mt-1 whitespace-pre-wrap">{reply.body}</p>
          </li>)}
        </ol>
        {ticket.status !== "closed" ? (
          <div className="mt-4 space-y-3">
            <Textarea label="Reply" value={replyDrafts[ticket.id] ?? ""} onChange={(event) => setReplyDrafts((current) => ({ ...current, [ticket.id]: event.target.value }))} maxLength={4000} />
            <div className="flex gap-2">
              <Button type="button" variant="secondary" loading={busy} onClick={() => void reply(ticket.id)}>Send reply</Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={() => void close(ticket.id)}>Close ticket</Button>
            </div>
          </div>
        ) : <p className="mt-4 text-sm text-ink-mute">This ticket is closed.</p>}
      </Card>)}
      {tickets.length === 0 && <p className="text-sm text-ink-mute">No support tickets yet.</p>}
    </div>
  );
}

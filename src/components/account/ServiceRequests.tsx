"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { services } from "@/data/services";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type RequestRow = { id: string; service_type: string; details: string; status: string; created_at: string };

export function ServiceRequests({ userId, initialName, initialEmail, requests }: {
  userId: string; initialName: string; initialEmail: string; requests: RequestRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [service, setService] = useState("");
  const [details, setDetails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Account services are not configured."); return; }
    if (name.trim().length < 2 || details.trim().length < 20 || details.length > 2000 || !service) {
      setMessage("Enter your name, choose a service, and describe your request in at least 20 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("service_requests").insert({
      user_id: userId, customer_name: name.trim(), customer_email: email.trim(),
      service_type: service, details: details.trim(),
    });
    setBusy(false);
    if (error) setMessage(`Could not submit the request: ${error.message}`);
    else { setMessage("Request submitted."); setDetails(""); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} />
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
        <Select label="Service" value={service} onChange={(event) => setService(event.target.value)} required>
          <option value="">Choose a service</option>{services.map((item) => <option key={item.slug} value={item.title}>{item.title}</option>)}
        </Select>
        <Textarea label="Project details" value={details} onChange={(event) => setDetails(event.target.value)} required minLength={20} maxLength={2000} />
        <Button type="submit" loading={busy}>Submit service request</Button>
      </form>
      {message && <p role="status" className="text-sm text-ink-mute">{message}</p>}
      <div className="space-y-3">
        {requests.map((request) => <Card key={request.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">{request.service_type}</h3>
            <span className="text-sm capitalize text-secondary-soft">{request.status.replace(/_/g, " ")}</span>
          </div>
          <p className="mt-1 text-xs text-ink-mute">{new Date(request.created_at).toLocaleDateString()}</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-ink-mute">{request.details}</p>
        </Card>)}
        {requests.length === 0 && <p className="text-sm text-ink-mute">No service requests yet.</p>}
      </div>
    </div>
  );
}

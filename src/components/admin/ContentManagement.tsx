"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Field";

type ServiceRow = { id: string; slug: string; title: string; description: string; deliverables: string[]; is_published: boolean };
type ProjectRow = {
  id: string; slug: string; title: string; category: string | null; summary: string; brief: string; approach: string;
  deliverables: string[]; tags: string[]; live_url: string | null; cover_image_path: string | null;
  is_demo: boolean; is_published: boolean;
};
type RequestRow = {
  id: string; customer_name: string; customer_email: string; service_type: string; details: string;
  status: string; created_at: string; contact_method: string | null; contact_value: string | null;
};
type SupportMessage = { id: string; sender_id: string; body: string; created_at: string };
type SupportTicket = { id: string; user_id: string; subject: string; status: string; created_at: string; messages: SupportMessage[] };
type Payload = Record<string, string | boolean | null>;

const REQUEST_TRANSITIONS: Record<string, string[]> = {
  new: ["reviewing", "rejected"], reviewing: ["in_progress", "rejected"],
  in_progress: ["completed", "rejected"], completed: [], rejected: [],
};

export function ContentManagement({ services, projects, requests, tickets, loadError }: {
  services: ServiceRow[]; projects: ProjectRow[]; requests: RequestRow[]; tickets: SupportTicket[]; loadError?: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(values: Payload): Promise<boolean> {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setMessage(result.error ?? "The action failed."); return false; }
      setMessage("Saved.");
      router.refresh();
      return true;
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-12 space-y-10">
      <h2 className="text-3xl font-semibold">Services, portfolio, and requests</h2>
      {loadError && <p role="alert" className="rounded-xl border border-red-400/40 p-4 text-red-300">{loadError}</p>}
      {message && <p role="status" className="rounded-xl border border-cyan/30 p-3 text-cyan-soft">{message}</p>}

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Services</h3>
        <Card><ServiceEditor onSave={send} busy={busy} /></Card>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {services.map((service) => <Card key={service.id}>
            <ServiceEditor service={service} onSave={send} busy={busy} />
            {service.is_published && <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => void send({ action: "deactivate_service", id: service.id })}>Deactivate (soft delete)</Button>}
          </Card>)}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Portfolio projects</h3>
        <Card><ProjectEditor onSave={send} busy={busy} /></Card>
        <div className="mt-3 space-y-3">
          {projects.map((project) => <Card key={project.id}>
            <ProjectEditor project={project} onSave={send} busy={busy} />
            {project.is_published && <Button className="mt-3" variant="secondary" disabled={busy} onClick={() => void send({ action: "deactivate_project", id: project.id })}>Unpublish project</Button>}
          </Card>)}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Service requests</h3>
        {requests.length === 0 && <p className="text-ink-mute">No service requests have been submitted.</p>}
        <div className="space-y-3">
          {requests.map((request) => <Card key={request.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h4 className="font-semibold">{request.service_type}</h4><p className="text-sm text-ink-mute">{request.customer_name} · {request.customer_email}</p>
                {request.contact_method && <p className="text-sm text-ink-mute">{request.contact_method}: {request.contact_value}</p>}
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-mute">{request.details}</p>
                <p className="mt-1 text-xs text-ink-mute">{new Date(request.created_at).toLocaleString()}</p>
              </div>
              <span className="capitalize text-cyan-soft">{request.status.replace(/_/g, " ")}</span>
            </div>
            {REQUEST_TRANSITIONS[request.status]?.length > 0 && <label className="mt-4 block text-sm text-ink-mute">Update request status
              <select className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-obsidian-800 px-4 text-ink" defaultValue="" disabled={busy} onChange={(event) => {
                if (event.target.value) void send({ action: "update_request_status", id: request.id, status: event.target.value });
                event.target.value = "";
              }}>
                <option value="">Select an allowed transition</option>{REQUEST_TRANSITIONS[request.status].map((status) => <option key={status}>{status}</option>)}
              </select>
            </label>}
          </Card>)}
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-2xl font-semibold">Support inbox</h3>
        {tickets.length === 0 && <p className="text-ink-mute">No support tickets have been submitted.</p>}
        <div className="space-y-3">
          {tickets.map((ticket) => <SupportInboxTicket key={ticket.id} ticket={ticket} onSave={send} busy={busy} />)}
        </div>
      </section>
    </div>
  );
}

function SupportInboxTicket({ ticket, onSave, busy }: {
  ticket: SupportTicket; onSave: (values: Payload) => Promise<boolean>; busy: boolean;
}) {
  const [reply, setReply] = useState("");
  const statuses: Record<string, string[]> = {
    open: ["in_progress", "closed"], in_progress: ["open", "closed"], closed: ["open"],
  };
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h4 className="font-semibold">{ticket.subject}</h4><p className="text-xs text-ink-mute">Customer {ticket.user_id} · {new Date(ticket.created_at).toLocaleString()}</p></div>
        <span className="capitalize text-cyan-soft">{ticket.status.replace(/_/g, " ")}</span>
      </div>
      <ol className="mt-4 space-y-3">
        {ticket.messages.map((message) => <li key={message.id} className="rounded-xl border border-line p-3">
          <p className="text-xs text-ink-mute">{message.sender_id === ticket.user_id ? "Customer" : "Admin"} · {new Date(message.created_at).toLocaleString()}</p>
          <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
        </li>)}
      </ol>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {statuses[ticket.status]?.length > 0 && <label className="text-sm text-ink-mute">Status
          <select className="mt-1 min-h-[44px] rounded-xl border border-line bg-obsidian-800 px-4 text-ink" defaultValue="" disabled={busy} onChange={(event) => {
            if (event.target.value) void onSave({ action: "support_status", id: ticket.id, status: event.target.value });
            event.target.value = "";
          }}>
            <option value="">Choose</option>{statuses[ticket.status].map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>}
        {ticket.status !== "closed" && <form className="flex min-w-0 flex-1 gap-2" onSubmit={(event) => {
          event.preventDefault();
          void onSave({ action: "support_reply", id: ticket.id, message: reply }).then((ok) => { if (ok) setReply(""); });
        }}>
          <Textarea label="Reply to customer" value={reply} onChange={(event) => setReply(event.target.value)} maxLength={4000} required />
          <Button type="submit" loading={busy}>Reply</Button>
        </form>}
      </div>
    </Card>
  );
}

function ServiceEditor({ service, onSave, busy }: { service?: ServiceRow; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [title, setTitle] = useState(service?.title ?? "");
  const [slug, setSlug] = useState(service?.slug ?? "");
  const [description, setDescription] = useState(service?.description ?? "");
  const [deliverables, setDeliverables] = useState((service?.deliverables ?? []).join("\n"));
  const [published, setPublished] = useState(service?.is_published ?? false);
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "save_service", id: service?.id ?? null, title, slug, description, deliverables, is_published: published });
    }}>
      <Input label="Service title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} required />
      <Input label="Slug" value={slug} maxLength={100} onChange={(event) => setSlug(event.target.value)} required pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" />
      <Textarea label="Description" value={description} maxLength={3000} onChange={(event) => setDescription(event.target.value)} />
      <Textarea label="Deliverables (one per line)" value={deliverables} onChange={(event) => setDeliverables(event.target.value)} />
      <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Published</label>
      <Button type="submit" loading={busy}>{service ? "Save service" : "Create service"}</Button>
    </form>
  );
}

function ProjectEditor({ project, onSave, busy }: { project?: ProjectRow; onSave: (values: Payload) => Promise<boolean>; busy: boolean }) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  const [category, setCategory] = useState(project?.category ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [brief, setBrief] = useState(project?.brief ?? "");
  const [approach, setApproach] = useState(project?.approach ?? "");
  const [deliverables, setDeliverables] = useState((project?.deliverables ?? []).join("\n"));
  const [tags, setTags] = useState((project?.tags ?? []).join("\n"));
  const [liveUrl, setLiveUrl] = useState(project?.live_url ?? "");
  const [coverPath, setCoverPath] = useState(project?.cover_image_path ?? "");
  const [demo, setDemo] = useState(project?.is_demo ?? false);
  const [published, setPublished] = useState(project?.is_published ?? false);
  return (
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
      event.preventDefault();
      void onSave({ action: "save_project", id: project?.id ?? null, title, slug, category, summary, brief, approach, deliverables, tags, live_url: liveUrl, cover_image_path: coverPath, is_demo: demo, is_published: published });
    }}>
      <Input label="Project title" value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} required />
      <Input label="Slug" value={slug} maxLength={100} onChange={(event) => setSlug(event.target.value)} required pattern="[A-Za-z0-9]+(-[A-Za-z0-9]+)*" />
      <Input label="Category" value={category} maxLength={80} onChange={(event) => setCategory(event.target.value)} required />
      <Input label="Summary" value={summary} maxLength={1000} onChange={(event) => setSummary(event.target.value)} />
      <Textarea label="Brief" value={brief} maxLength={4000} onChange={(event) => setBrief(event.target.value)} />
      <Textarea label="Approach" value={approach} maxLength={4000} onChange={(event) => setApproach(event.target.value)} />
      <Textarea label="Deliverables (one per line)" value={deliverables} onChange={(event) => setDeliverables(event.target.value)} />
      <Textarea label="Tags (one per line)" value={tags} onChange={(event) => setTags(event.target.value)} />
      <Input label="Live URL (optional)" type="url" value={liveUrl} maxLength={1000} onChange={(event) => setLiveUrl(event.target.value)} />
      <Input label="Cover image storage path (optional)" value={coverPath} maxLength={500} onChange={(event) => setCoverPath(event.target.value)} />
      <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} /> Sample/demo concept</label>
      <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={published} onChange={(event) => setPublished(event.target.checked)} /> Published</label>
      <Button type="submit" loading={busy}>{project ? "Save project" : "Create project"}</Button>
    </form>
  );
}

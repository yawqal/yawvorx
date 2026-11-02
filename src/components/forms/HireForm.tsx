"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PreparedMessage } from "./PreparedMessage";
import { services as staticServices, type Service } from "@/data/services";
import { BLANK, BUDGETS, CONTACT_METHODS, joinLines, validateHire, type Errors, type HireValues } from "@/lib/validation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function HireForm({ defaultService = "", availableServices = staticServices }: { defaultService?: string; availableServices?: Service[] }) {
  const [v, setV] = useState<HireValues>({ name: "", contactMethod: "Telegram", contactValue: "", service: defaultService, description: "", budget: BUDGETS[0], deadline: "", reference: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (v.website) return; // hidden spam trap: real people never fill it
    const found = validateHire(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    const svc = availableServices.find((s) => s.slug === v.service)?.title ?? v.service;
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      setBusy(true);
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError) { setBusy(false); setErrors({ submission: "We could not verify your sign-in. Please refresh the page and try again." }); return; }
      if (data.user) {
        const { error } = await supabase.from("service_requests").insert({
          user_id: data.user.id,
          customer_name: v.name.trim(),
          customer_email: data.user.email ?? "",
          service_type: svc,
          details: v.description.trim(),
          contact_method: v.contactMethod,
          contact_value: v.contactValue.trim(),
          budget: v.budget,
          deadline: v.deadline || null,
          reference_url: v.reference.trim() || null,
        });
        setBusy(false);
        if (error) { setErrors({ submission: `Could not save your request: ${error.message}` }); return; }
        setSaved(true);
        return;
      }
      setBusy(false);
    }
    setMessage(joinLines([
      "New project request (YAWVOREX)", `Name: ${v.name.trim()}`, `Contact (${v.contactMethod}): ${v.contactValue.trim()}`,
      `Service: ${svc}`, `Budget: ${v.budget}`, v.deadline && `Deadline: ${v.deadline}`, v.reference.trim() && `Reference: ${v.reference.trim()}`,
      BLANK, v.description.trim(),
    ]));
  };

  if (message) return (
    <div className="space-y-4">
      <PreparedMessage title="Your request is ready" message={message} subject="Project request" />
      <Button variant="ghost" onClick={() => setMessage(null)}>Edit request</Button>
    </div>
  );
  if (saved) return (
    <div className="space-y-4">
      <p role="status" className="rounded-xl border border-brand/30 p-4 text-secondary-soft">Your service request has been saved to your account. We will contact you using the details you provided.</p>
      <Button variant="secondary" href="/account#service-requests">View my requests</Button>
      <Button variant="ghost" onClick={() => setSaved(false)}>Submit another request</Button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="text-sm text-ink-mute">Signed-in requests are saved in your account. If you continue as a guest, we prepare a message for you to send.</p>
      <Input label="Your name" name="name" autoComplete="name" value={v.name} onChange={change} error={errors.name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Preferred contact method" name="contactMethod" value={v.contactMethod} onChange={change} error={errors.contactMethod}>
          {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
        </Select>
        <Input label="Your contact detail" name="contactValue" value={v.contactValue} onChange={change} error={errors.contactValue} hint="Username, email, or phone with country code." />
      </div>
      <Select label="Service needed" name="service" value={v.service} onChange={change} error={errors.service}>
        <option value="">Choose a service</option>
        {availableServices.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
      </Select>
      <Textarea label="Project description" name="description" value={v.description} onChange={change} error={errors.description} hint="What do you want to achieve? Who is it for?" />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Budget range (optional)" name="budget" value={v.budget} onChange={change}>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</Select>
        <Input label="Desired deadline (optional)" name="deadline" type="date" value={v.deadline} onChange={change} error={errors.deadline} />
      </div>
      <Input label="Reference link (optional)" name="reference" type="url" inputMode="url" placeholder="https://" value={v.reference} onChange={change} error={errors.reference} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={change} /></label>
      </div>
      {errors.submission && <p role="alert" className="text-red-300">{errors.submission}</p>}
      <Button type="submit" className="w-full sm:w-auto" loading={busy}>Submit project request</Button>
    </form>
  );
}

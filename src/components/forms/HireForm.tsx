"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { PreparedMessage } from "./PreparedMessage";
import { services } from "@/data/services";
import { BLANK, BUDGETS, CONTACT_METHODS, joinLines, validateHire, type Errors, type HireValues } from "@/lib/validation";

export function HireForm({ defaultService = "" }: { defaultService?: string }) {
  const [v, setV] = useState<HireValues>({ name: "", contactMethod: "Telegram", contactValue: "", service: defaultService, description: "", budget: BUDGETS[0], deadline: "", reference: "", website: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState<string | null>(null);

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setV((cur) => ({ ...cur, [e.target.name]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (v.website) return; // hidden spam trap: real people never fill it
    const found = validateHire(v);
    setErrors(found);
    if (Object.keys(found).length) return;
    const svc = services.find((s) => s.slug === v.service)?.title ?? v.service;
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

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input label="Your name" name="name" autoComplete="name" value={v.name} onChange={change} error={errors.name} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select label="Preferred contact method" name="contactMethod" value={v.contactMethod} onChange={change} error={errors.contactMethod}>
          {CONTACT_METHODS.map((m) => <option key={m}>{m}</option>)}
        </Select>
        <Input label="Your contact detail" name="contactValue" value={v.contactValue} onChange={change} error={errors.contactValue} hint="Username, email, or phone with country code." />
      </div>
      <Select label="Service needed" name="service" value={v.service} onChange={change} error={errors.service}>
        <option value="">Choose a service</option>
        {services.map((s) => <option key={s.slug} value={s.slug}>{s.title}</option>)}
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
      <Button type="submit" className="w-full sm:w-auto">Prepare my request</Button>
    </form>
  );
}

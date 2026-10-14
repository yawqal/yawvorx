"use client";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function ProfileForm({ userId, fullName, phone }: { userId: string; fullName: string; phone: string }) {
  const [name, setName] = useState(fullName);
  const [tel, setTel] = useState(phone);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length > 100 || tel.length > 30) { setMsg({ ok: false, text: "Name or phone is too long." }); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMsg({ ok: false, text: "Sign-in is not configured." }); return; }
    setBusy(true);
    // The database only lets you change YOUR OWN row, and only these two fields.
    const { error } = await supabase.from("profiles").update({ display_name: name.trim() || null, phone: tel.trim() || null }).eq("id", userId);
    setBusy(false);
    setMsg(error ? { ok: false, text: "Could not save your profile. Make sure the database setup (migrations) was completed." } : { ok: true, text: "Profile saved." });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Phone (optional)" type="tel" autoComplete="tel" value={tel} onChange={(e) => setTel(e.target.value)} />
      {msg && <p role="status" className={msg.ok ? "text-cyan-soft" : "text-red-300"}>{msg.text}</p>}
      <Button type="submit" loading={busy}>Save profile</Button>
    </form>
  );
}

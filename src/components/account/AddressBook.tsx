"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Address = {
  id: string; label: string; full_name: string; phone: string; address_line: string;
  city: string; region: string | null; country: string; postal_code: string | null; is_default: boolean;
};
type Draft = Omit<Address, "id"> & { id?: string };
const blank: Draft = { label: "Home", full_name: "", phone: "", address_line: "", city: "", region: "", country: "", postal_code: "", is_default: false };

export function AddressBook({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(blank);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const update = (key: keyof Draft, value: string | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Account services are not configured."); return; }
    setBusy(true);
    setMessage(null);
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) { setBusy(false); setMessage("Your session expired. Sign in again to save addresses."); return; }
    if (draft.is_default) {
      const { error } = await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", authData.user.id);
      if (error) { setBusy(false); setMessage(`Could not set the default address: ${error.message}`); return; }
    }
    const values = {
      label: draft.label.trim(), full_name: draft.full_name.trim(), phone: draft.phone.trim(),
      address_line: draft.address_line.trim(), city: draft.city.trim(), region: draft.region?.trim() || null,
      country: draft.country.trim(), postal_code: draft.postal_code?.trim() || null, is_default: draft.is_default,
    };
    const result = draft.id
      ? await supabase.from("customer_addresses").update(values).eq("id", draft.id)
      : await supabase.from("customer_addresses").insert({ ...values, user_id: authData.user.id });
    setBusy(false);
    if (result.error) { setMessage(`Could not save this address: ${result.error.message}`); return; }
    setDraft(blank);
    setMessage("Address saved.");
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Account services are not configured."); return; }
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) setMessage(`Could not remove this address: ${error.message}`);
    else { setMessage("Address removed."); router.refresh(); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
        <Input label="Label" value={draft.label} maxLength={60} onChange={(event) => update("label", event.target.value)} required />
        <Input label="Full name" value={draft.full_name} maxLength={100} onChange={(event) => update("full_name", event.target.value)} required />
        <Input label="Phone" type="tel" value={draft.phone} maxLength={30} onChange={(event) => update("phone", event.target.value)} required />
        <Input label="Address" value={draft.address_line} maxLength={300} onChange={(event) => update("address_line", event.target.value)} required />
        <Input label="City" value={draft.city} maxLength={100} onChange={(event) => update("city", event.target.value)} required />
        <Input label="Region (optional)" value={draft.region ?? ""} maxLength={100} onChange={(event) => update("region", event.target.value)} />
        <Input label="Country" value={draft.country} maxLength={100} onChange={(event) => update("country", event.target.value)} required />
        <Input label="Postal code (optional)" value={draft.postal_code ?? ""} maxLength={30} onChange={(event) => update("postal_code", event.target.value)} />
        <label className="flex min-h-[44px] items-center gap-2"><input type="checkbox" checked={draft.is_default} onChange={(event) => update("is_default", event.target.checked)} /> Default address</label>
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>{draft.id ? "Update address" : "Add address"}</Button>
          {draft.id && <Button type="button" variant="secondary" onClick={() => setDraft(blank)}>Cancel</Button>}
        </div>
      </form>
      {message && <p role="status" className="text-sm text-ink-mute">{message}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        {initial.map((address) => (
          <Card key={address.id}>
            <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{address.label}</h3>{address.is_default && <span className="text-xs text-secondary-soft">Default</span>}</div>
            <p className="mt-2 text-sm text-ink-mute">{address.full_name}<br />{address.address_line}<br />{[address.city, address.region, address.country, address.postal_code].filter(Boolean).join(", ")}<br />{address.phone}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" onClick={() => setDraft({ ...address, region: address.region ?? "", postal_code: address.postal_code ?? "" })}>Edit</Button>
              <Button variant="ghost" onClick={() => void remove(address.id)}>Remove</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

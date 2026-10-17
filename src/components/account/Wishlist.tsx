"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Choice = { id: string; name: string; slug: string };
type Saved = { id: string; product_id: string; name: string; slug: string };

export function Wishlist({ choices, saved }: { choices: Choice[]; saved: Saved[] }) {
  const router = useRouter();
  const [productId, setProductId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(event: React.FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Account services are not configured."); return; }
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data.user) { setMessage("Your session expired. Sign in again."); return; }
    setBusy(true);
    const { error } = await supabase.from("wishlist_items").insert({ user_id: data.user.id, product_id: productId });
    setBusy(false);
    if (error) setMessage(error.code === "23505" ? "That product is already on your wishlist." : `Could not add the product: ${error.message}`);
    else { setMessage("Added to your wishlist."); setProductId(""); router.refresh(); }
  }

  async function remove(id: string) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Account services are not configured."); return; }
    const { error } = await supabase.from("wishlist_items").delete().eq("id", id);
    if (error) setMessage(`Could not remove the product: ${error.message}`);
    else { setMessage("Removed from your wishlist."); router.refresh(); }
  }

  return (
    <div>
      {choices.length > 0 ? (
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={add}>
          <label className="flex-1 text-sm text-ink-mute">Add a product
            <select className="mt-1 w-full min-h-[44px] rounded-xl border border-line bg-obsidian-800 px-4 text-ink" value={productId} onChange={(event) => setProductId(event.target.value)} required>
              <option value="">Choose a product</option>{choices.map((choice) => <option key={choice.id} value={choice.id}>{choice.name}</option>)}
            </select>
          </label>
          <Button type="submit" loading={busy} className="self-end">Add to wishlist</Button>
        </form>
      ) : <p className="text-sm text-ink-mute">No active products are available to save right now.</p>}
      {message && <p role="status" className="mt-3 text-sm text-ink-mute">{message}</p>}
      {saved.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {saved.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 border-t border-line pt-3">
            <Link href={`/shop/${item.slug}`} className="underline">{item.name}</Link>
            <Button variant="ghost" onClick={() => void remove(item.id)}>Remove</Button>
          </li>)}
        </ul>
      ) : <p className="mt-4 text-sm text-ink-mute">Your wishlist is empty.</p>}
    </div>
  );
}

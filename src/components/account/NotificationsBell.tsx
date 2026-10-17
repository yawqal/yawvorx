"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Notice = { id: string; title: string; body: string; href: string | null; read_at: string | null; created_at: string };

export function NotificationsBell({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Notifications are not configured."); return; }
    void supabase.from("notifications").select("id,title,body,href,read_at,created_at")
      .eq("user_id", userId).order("created_at", { ascending: false }).limit(10)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setMessage(`Could not load notifications: ${error.message}`);
        else { setItems(data ?? []); setMessage(null); }
      });
    return () => { active = false; };
  }, [userId, open]);

  const unread = items.filter((item) => !item.read_at).length;
  async function openNotice(item: Notice) {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setMessage("Notifications are not configured."); return; }
    if (!item.read_at) {
      const readAt = new Date().toISOString();
      const { error } = await supabase.from("notifications").update({ read_at: readAt }).eq("id", item.id);
      if (error) { setMessage(`Could not mark notification as read: ${error.message}`); return; }
      setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read_at: readAt } : notice));
    }
    setOpen(false);
    if (item.href?.startsWith("/") && !item.href.startsWith("//")) router.push(item.href);
  }

  return (
    <div className="relative">
      <button type="button" className="relative inline-flex min-h-[44px] items-center justify-center rounded-xl px-3 text-ink-mute hover:text-ink"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unread > 0 && <span className="absolute right-1 top-1 rounded-full bg-amber-400 px-1.5 text-[10px] font-bold text-obsidian">{unread}</span>}
      </button>
      {open && <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-line bg-obsidian-900 p-3 shadow-xl">
        <h2 className="font-semibold">Notifications</h2>
        {message && <p role="alert" className="mt-2 text-sm text-red-300">{message}</p>}
        {items.length === 0 ? <p className="mt-2 text-sm text-ink-mute">No notifications yet.</p> : (
          <ul className="mt-2 max-h-80 space-y-2 overflow-y-auto">
            {items.map((item) => <li key={item.id}>
              <button type="button" className={`w-full rounded-lg border border-line p-3 text-left ${item.read_at ? "opacity-70" : "bg-cyan/5"}`} onClick={() => void openNotice(item)}>
                <span className="block font-medium">{item.title}</span>
                {item.body && <span className="mt-1 block text-sm text-ink-mute">{item.body}</span>}
                <span className="mt-1 block text-xs text-ink-mute">{new Date(item.created_at).toLocaleString()}</span>
              </button>
            </li>)}
          </ul>
        )}
        <button type="button" className="mt-2 min-h-[40px] text-sm text-cyan-soft underline" onClick={() => { setOpen(false); router.push("/account#notifications"); }}>View account</button>
      </div>}
    </div>
  );
}

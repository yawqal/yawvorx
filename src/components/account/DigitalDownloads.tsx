"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Download = { fileName: string; url: string };

export function DigitalDownloads({ orderId }: { orderId: string }) {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setBusy(true);
    setMessage(null);
    setDownloads([]);
    try {
      const response = await fetch(`/api/downloads/${encodeURIComponent(orderId)}`, { cache: "no-store" });
      const result = await response.json() as { downloads?: Download[]; error?: string };
      if (!response.ok) { setMessage(result.error ?? "Downloads are not available."); return; }
      setDownloads(result.downloads ?? []);
      if (!result.downloads?.length) setMessage("No files are attached to this order yet.");
    } catch {
      setMessage("Could not load downloads. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <Button variant="secondary" loading={busy} onClick={() => void load()}>Get secure download links</Button>
      {message && <p role="status" className="mt-2 text-sm text-ink-mute">{message}</p>}
      {downloads.length > 0 && <>
        <p className="mt-2 text-xs text-ink-mute">These private links expire after one minute.</p>
        <ul className="mt-2 space-y-2">{downloads.map((download) => <li key={`${download.fileName}:${download.url}`}>
          <a className="text-secondary-soft underline" href={download.url}>{download.fileName}</a>
        </li>)}</ul>
      </>}
    </div>
  );
}

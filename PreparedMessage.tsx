"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { socialLinks, whatsappLink, emailLink } from "@/config/site";

/** Shows a ready-to-send message. Nothing is stored yet: saving to the database arrives in Phase 4 and 5. */
export function PreparedMessage({ title, message, subject, saved = false }: { title: string; message: string; subject: string; saved?: boolean }) {
  const [copied, setCopied] = useState(false);
  const wa = whatsappLink(message);
  const mail = emailLink();
  const telegram = socialLinks()[0].href;

  const copy = async () => {
    try { await navigator.clipboard.writeText(message); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <Card className="space-y-4" >
      <div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold">{title}</h2>{saved ? <Badge tone="ok">Order saved</Badge> : <Badge tone="warn">Not saved yet</Badge>}</div>
      <p className="text-ink-mute">{saved
        ? "Your order is saved. To speed things up, you can also send this message to YAWVOREX through one of the channels below."
        : "Database saving is not connected in this version. To send this to YAWVOREX, copy the message and send it through one of the channels below."}</p>
      <pre className="whitespace-pre-wrap break-words rounded-xl border border-line bg-obsidian-800 p-4 text-sm">{message}</pre>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button onClick={copy}>{copied ? "Copied" : "Copy message"}</Button>
        <Button variant="secondary" href={telegram}>Open Telegram</Button>
        {wa && <Button variant="secondary" href={wa}>Send on WhatsApp</Button>}
        {mail && <Button variant="secondary" href={`${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`}>Send by email</Button>}
      </div>
      {(!wa || !mail) && <p className="text-sm text-ink-mute">{!wa && "WhatsApp "}{!wa && !mail && "and "}{!mail && "Email "}will appear here once the owner sets it up.</p>}
    </Card>
  );
}

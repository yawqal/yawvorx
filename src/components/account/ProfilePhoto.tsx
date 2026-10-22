"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ProfilePhoto({ userId, name, email, initialUrl, initialPath, configured }: {
  userId: string; name: string; email: string; initialUrl: string | null; initialPath: string | null; configured: boolean;
}) {
  const [src, setSrc] = useState(initialUrl);
  const [selected, setSelected] = useState<File | null>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const objectUrl = useRef<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSrc(initialUrl);
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  }, [initialUrl]);

  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  }, []);

  function selectFile(file: File | undefined) {
    if (!file) return;
    setMessage(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setSelected(null);
      setMessage({ ok: false, text: "Choose a JPEG, PNG, or WebP image." });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setSelected(null);
      setMessage({ ok: false, text: "Choose an image smaller than 5 MB." });
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setSelected(file);
    setSrc(objectUrl.current);
  }

  async function upload() {
    if (!selected || busy) return;
    if (!configured) {
      setMessage({ ok: false, text: "Apply the profile photo Supabase migration before uploading." });
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage({ ok: false, text: "Photo uploads are not configured. Please try again later." });
      return;
    }
    const extension = selected.type === "image/jpeg" ? "jpg" : selected.type === "image/png" ? "png" : "webp";
    const path = `${userId}/${crypto.randomUUID()}.${extension}`;
    setBusy(true);
    setMessage(null);

    const { error: uploadError } = await supabase.storage.from("profile-photos").upload(path, selected, {
      cacheControl: "3600",
      contentType: selected.type,
      upsert: false,
    });
    if (uploadError) {
      setBusy(false);
      setMessage({ ok: false, text: "Upload failed. Confirm the profile photo storage setup and try again." });
      return;
    }

    const { error: profileError } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
    if (profileError) {
      const { error: cleanupError } = await supabase.storage.from("profile-photos").remove([path]);
      if (cleanupError) console.error("Could not remove an unlinked profile photo:", cleanupError.message);
      setBusy(false);
      setMessage({ ok: false, text: "The photo uploaded, but your profile could not be updated. Confirm the profile photo database setup and try again." });
      return;
    }

    if (currentPath) {
      const { error: removeError } = await supabase.storage.from("profile-photos").remove([currentPath]);
      if (removeError) console.error("Could not remove the previous profile photo:", removeError.message);
    }
    const { data: signedPhoto, error: signedUrlError } = await supabase.storage.from("profile-photos").createSignedUrl(path, 3600);
    if (signedUrlError) console.error("Could not create a signed profile photo URL:", signedUrlError.message);
    setSelected(null);
    setBusy(false);
    setCurrentPath(path);
    setSrc(signedPhoto?.signedUrl ?? objectUrl.current);
    if (signedPhoto && objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
    setMessage({ ok: true, text: signedUrlError ? "Profile photo saved. Refresh the page to display it." : "Profile photo updated." });
  }

  const label = name || email;
  const initialsLabel = initials(name || email.split("@")[0]);

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-white/15 bg-obsidian-700 ring-4 ring-violet/10 sm:h-32 sm:w-32">
        {src
          ? <Image src={src} alt={`${label}'s profile photo`} fill sizes="128px" unoptimized className="object-cover" />
          : <div aria-label="Default profile avatar" className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/25 to-cyan/15 text-2xl font-semibold text-ink">
            {initialsLabel || <UserRound size={40} strokeWidth={1.4} />}
          </div>}
      </div>
      <div className="min-w-0 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan">Your profile</p>
        <p className="mt-2 break-all text-sm text-ink-mute">{email}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Choose a profile photo"
            onChange={(event) => selectFile(event.target.files?.[0])} />
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-obsidian-800 px-4 text-sm font-medium transition hover:border-violet/50 disabled:opacity-50">
            <Camera size={16} aria-hidden="true" />{src ? "Change photo" : "Upload photo"}
          </button>
          {selected && <button type="button" disabled={busy || !configured} onClick={() => void upload()}
            className="min-h-11 rounded-xl bg-gradient-to-r from-violet to-cyan px-4 text-sm font-semibold text-obsidian disabled:opacity-50">
            {busy ? "Uploading…" : "Save photo"}
          </button>}
        </div>
        <p className="mt-2 text-xs text-ink-mute">JPEG, PNG, or WebP · Max 5 MB</p>
        {!configured && <p className="mt-2 max-w-md text-xs text-amber-200">Profile photo storage is not enabled yet. The required Supabase migration must be applied first.</p>}
        {message && <p role={message.ok ? "status" : "alert"} className={`mt-2 text-sm ${message.ok ? "text-cyan-soft" : "text-red-300"}`}>{message.text}</p>}
      </div>
    </div>
  );
}

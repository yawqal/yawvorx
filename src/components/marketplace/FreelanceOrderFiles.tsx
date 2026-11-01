"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type OrderFile = {
  id: string;
  kind: "reference" | "delivery";
  filename: string;
  size_bytes: number;
  created_at: string;
};

type Props = {
  orderId: string;
  status: string;
  isFreelancer: boolean;
  files: OrderFile[];
  loadError?: string;
};

const maxFileSize = 10 * 1024 * 1024;
const extensions = new Set(["pdf", "png", "jpg", "jpeg", "webp", "zip", "txt", "docx", "mp4"]);

function formatSize(size: number) {
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function safeFilename(name: string) {
  const basename = name.split(/[\\/]/).pop() ?? "";
  const safe = basename.replace(/[\\/]/g, "").replace(/\s+/g, "-").replace(/\.\./g, ".").slice(0, 100);
  return safe || "file";
}

export function FreelanceOrderFiles({ orderId, status, isFreelancer, files, loadError }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const terminal = ["declined", "cancelled", "completed"].includes(status);
  const uploadKind = isFreelancer
    ? ["accepted", "in_progress", "revision_requested"].includes(status) ? "delivery" : null
    : terminal ? null : "reference";

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0] ?? null;
    setError("");
    setMessage("");
    if (!file) { setSelected(null); return; }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!extensions.has(extension)) {
      setSelected(null);
      setError("Choose a PDF, PNG, JPG, JPEG, WebP, ZIP, TXT, DOCX, or MP4 file.");
      event.currentTarget.value = "";
      return;
    }
    if (file.size < 1 || file.size > maxFileSize) {
      setSelected(null);
      setError("File size must be greater than 0 and no more than 10 MB.");
      event.currentTarget.value = "";
      return;
    }
    setSelected(file);
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !uploadKind) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) { setError("File storage is not configured."); return; }
      const filename = safeFilename(selected.name);
      const path = `${orderId}/${crypto.randomUUID()}-${filename}`;
      const { error: storageError } = await supabase.storage.from("order-files").upload(path, selected, { upsert: false });
      if (storageError) { setError(`File could not be uploaded: ${storageError.message}`); return; }

      const response = await fetch(`/api/freelance-orders/${encodeURIComponent(orderId)}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: uploadKind, path, filename, size_bytes: selected.size }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) { setError(result.error ?? "File could not be attached to the order."); return; }
      setSelected(null);
      if (inputRef.current) inputRef.current.value = "";
      setMessage("File uploaded successfully.");
      router.refresh();
    } catch {
      setError("Could not upload the file. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function downloadFile(file: OrderFile) {
    setDownloading(file.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/freelance-orders/${encodeURIComponent(orderId)}/files/${encodeURIComponent(file.id)}`, { cache: "no-store" });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) { setError(result.error ?? "File could not be downloaded."); return; }
      window.location.assign(result.url);
    } catch {
      setError("Could not download the file. Check your connection and try again.");
    } finally {
      setDownloading("");
    }
  }

  function fileList(kind: OrderFile["kind"], title: string) {
    const matchingFiles = files.filter((file) => file.kind === kind);
    return <section className="min-w-0">
      <h3 className="text-lg font-semibold">{title}</h3>
      {matchingFiles.length ? <ul className="mt-3 grid min-w-0 gap-3">{matchingFiles.map((file) => (
        <li key={file.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4">
          <div className="min-w-0">
            <p className="break-all font-medium">{file.filename}</p>
            <p className="mt-1 text-sm text-ink-mute">{formatSize(file.size_bytes)} · <time dateTime={file.created_at}>{new Date(file.created_at).toLocaleDateString()}</time></p>
          </div>
          <Button type="button" variant="secondary" loading={downloading === file.id} disabled={Boolean(downloading)} onClick={() => void downloadFile(file)}>Download</Button>
        </li>
      ))}</ul> : <p className="mt-2 text-sm text-ink-mute">No {kind === "reference" ? "reference" : "delivered"} files yet.</p>}
    </section>;
  }

  return <section className="grid min-w-0 gap-6" aria-labelledby="order-files-heading">
    <h2 id="order-files-heading" className="text-xl font-semibold">Order files</h2>
    {loadError ? <p role="alert" className="break-words text-red-300">Files could not be loaded: {loadError}</p> : <>
      {fileList("reference", "Reference files")}
      {fileList("delivery", "Delivered files")}
    </>}
    {uploadKind && <form className="grid min-w-0 gap-3" onSubmit={uploadFile}>
      <label htmlFor="order-file" className="font-medium">{uploadKind === "reference" ? "Add reference file" : "Upload delivery file"}</label>
      <input
        ref={inputRef}
        id="order-file"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,.zip,.txt,.docx,.mp4"
        onChange={selectFile}
        className="min-h-[44px] w-full min-w-0 rounded-xl border border-line bg-white p-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      />
      <Button type="submit" loading={busy} disabled={!selected || busy}>{uploadKind === "reference" ? "Add reference file" : "Upload delivery file"}</Button>
    </form>}
    <p role="status" aria-live="polite" className="min-h-5 break-words text-sm text-secondary-soft">{message}</p>
    <p role="alert" aria-live="polite" className="min-h-5 break-words text-sm text-red-300">{error}</p>
  </section>;
}

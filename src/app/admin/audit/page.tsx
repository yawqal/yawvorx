import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Audit log", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const pageSize = 25;

export default async function AuditLog({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; table_name?: string; page?: string }>;
}) {
  await requireAdmin();
  const resolvedSearchParams = await searchParams;
  const action = typeof resolvedSearchParams.action === "string" ? resolvedSearchParams.action.trim().slice(0, 100) : "";
  const tableName = typeof resolvedSearchParams.table_name === "string" ? resolvedSearchParams.table_name.trim().slice(0, 100) : "";
  const parsedPage = Number(typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, 1_000_000) : 1;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Audit log" /><Container className="py-10"><p role="alert">Database is not configured.</p></Container></>;
  }

  let query = supabase.from("audit_log")
    .select("id,actor,action,table_name,record_id,old_data,new_data,reason,created_at", { count: "exact" });
  if (action) query = query.eq("action", action);
  if (tableName) query = query.eq("table_name", tableName);
  const { data, error, count } = await query.order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (tableName) params.set("table_name", tableName);
  const querySuffix = params.size ? `&${params.toString()}` : "";
  return (
    <>
      <PageHeader title="Audit log" intro="Administrative changes recorded by the application." />
      <Container className="space-y-5 py-10">
        <form method="get" className="grid gap-3 rounded-2xl border border-line p-4 sm:grid-cols-3">
          <label className="text-sm text-ink-mute">Action
            <input name="action" maxLength={100} defaultValue={action} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink" />
          </label>
          <label className="text-sm text-ink-mute">Table
            <input name="table_name" maxLength={100} defaultValue={tableName} className="mt-1 min-h-11 w-full rounded-xl border border-line bg-obsidian-800 px-3 text-ink" />
          </label>
          <button className="self-end rounded-xl bg-cyan px-4 py-3 font-semibold text-obsidian">Filter</button>
        </form>
        {error && <p role="alert" className="text-red-300">Audit log could not be loaded: {error.message}</p>}
        {!error && (data ?? []).map((entry) => (
          <Card key={entry.id}>
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-semibold">{entry.action} · {entry.table_name}</h2>
              <time className="text-sm text-ink-mute" dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
            </div>
            <p className="mt-1 break-all text-sm text-ink-mute">Record: {entry.record_id} · Actor: {entry.actor}</p>
            {entry.reason && <p className="mt-2 text-sm">{entry.reason}</p>}
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-cyan-soft">Change details</summary>
              <pre className="mt-2 overflow-auto rounded-lg bg-obsidian-900 p-3 text-xs">{JSON.stringify({ old_data: entry.old_data, new_data: entry.new_data }, null, 2)}</pre>
            </details>
          </Card>
        ))}
        {!error && (data ?? []).length === 0 && <Card><p className="text-ink-mute">No matching audit records.</p></Card>}
        <nav aria-label="Audit log pages" className="flex justify-between">
          {page > 1
            ? <Link className="rounded-xl border border-line px-4 py-3 underline" href={`/admin/audit?page=${page - 1}${querySuffix}`}>Previous</Link>
            : <span />}
          <span className="self-center text-sm text-ink-mute">Page {page} of {Math.max(1, Math.ceil((count ?? 0) / pageSize))}</span>
          {page * pageSize < (count ?? 0)
            ? <Link className="rounded-xl border border-line px-4 py-3 underline" href={`/admin/audit?page=${page + 1}${querySuffix}`}>Next</Link>
            : <span />}
        </nav>
      </Container>
    </>
  );
}

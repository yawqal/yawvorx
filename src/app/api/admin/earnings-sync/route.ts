import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data, error } = await supabase.rpc("yvx_backfill_earnings");
  if (error) return NextResponse.json({ error: `Earnings sync failed: ${error.message}` }, { status: 500 });
  if (typeof data !== "number" || !Number.isInteger(data)) {
    return NextResponse.json({ error: "Earnings sync returned an invalid count." }, { status: 500 });
  }
  return NextResponse.json({ count: data });
}

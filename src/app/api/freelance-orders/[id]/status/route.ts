import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const allowed = new Set(["accepted", "declined", "in_progress", "submitted", "cancelled", "revision_requested", "completed"]);
type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to update this order." }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const status = body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>).status : null;
    if (typeof status !== "string" || !allowed.has(status)) return NextResponse.json({ error: "Choose a valid order status." }, { status: 400 });
    const { error } = await supabase.rpc("yvx_freelancer_order_transition", { p_order_id: id, p_new_status: status });
    if (error) {
      const forbidden = /permission|not authorized|not a participant|forbidden/i.test(error.message);
      return NextResponse.json({ error: error.message || "Order status could not be updated." }, { status: forbidden ? 403 : 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("freelance order status failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Order status could not be updated." }, { status: 500 });
  }
}

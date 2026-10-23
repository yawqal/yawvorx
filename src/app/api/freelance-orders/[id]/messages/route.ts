import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to send a message." }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const text = body && typeof body === "object" && !Array.isArray(body) && typeof (body as Record<string, unknown>).body === "string"
      ? ((body as Record<string, unknown>).body as string).trim() : "";
    if (text.length < 1 || text.length > 2000) return NextResponse.json({ error: "Message must be 1–2000 characters." }, { status: 400 });
    const { error } = await supabase.from("freelancer_order_messages").insert({ order_id: id, body: text });
    if (error) {
      const forbidden = /permission|not authorized|not a participant|forbidden/i.test(error.message);
      return NextResponse.json({ error: error.message || "Message could not be sent." }, { status: forbidden ? 403 : 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("freelance order message failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Message could not be sent." }, { status: 500 });
  }
}

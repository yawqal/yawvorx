import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const allowedKinds = new Set(["reference", "delivery"]);

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to upload an order file." }, { status: 401 });
    const { id } = await params;
    if (!uuidPattern.test(id)) return NextResponse.json({ error: "Order id must be a UUID." }, { status: 400 });
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const values = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const { kind, path, filename, size_bytes: sizeBytes } = values;
    if (typeof kind !== "string" || !allowedKinds.has(kind)) return NextResponse.json({ error: "File kind must be reference or delivery." }, { status: 400 });
    if (typeof path !== "string" || !path.startsWith(`${id}/`) || path.length <= id.length + 1 || path.includes("..")) return NextResponse.json({ error: "File path is invalid." }, { status: 400 });
    if (typeof filename !== "string" || filename.length < 1 || filename.length > 200) return NextResponse.json({ error: "Filename must be 1–200 characters." }, { status: 400 });
    if (typeof sizeBytes !== "number" || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 10485760) {
      return NextResponse.json({ error: "File size must be an integer from 1 to 10485760 bytes." }, { status: 400 });
    }

    const { error } = await supabase.from("freelancer_order_files").insert({
      order_id: id, kind, path, filename, size_bytes: sizeBytes,
    });
    if (error) {
      const forbidden = /permission|not authorized|not a participant|forbidden|row-level security/i.test(error.message);
      return NextResponse.json({ error: forbidden ? "You are not permitted to attach this file to the order." : "File could not be attached to the order." }, { status: forbidden ? 403 : 400 });
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("freelance order file registration failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "File could not be attached to the order." }, { status: 500 });
  }
}

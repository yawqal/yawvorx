import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const today = () => new Date().toISOString().slice(0, 10);

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to place an order." }, { status: 401 });
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Request body must be an object." }, { status: 400 });
    const values = body as Record<string, unknown>;
    const serviceId = typeof values.service_id === "string" ? values.service_id : "";
    const details = typeof values.details === "string" ? values.details.trim() : "";
    const deadline = values.deadline == null || values.deadline === "" ? null : values.deadline;
    if (!UUID.test(serviceId)) return NextResponse.json({ error: "Choose a valid package." }, { status: 400 });
    if (details.length < 10 || details.length > 4000) return NextResponse.json({ error: "Project details must be 10–4000 characters." }, { status: 400 });
    if (deadline !== null && (typeof deadline !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(deadline) || deadline < today())) {
      return NextResponse.json({ error: "Deadline must be a valid date today or later." }, { status: 400 });
    }
    const { data, error } = await supabase.rpc("yvx_create_freelancer_order", {
      p_service_id: serviceId, p_details: details, p_deadline: deadline,
    });
    if (error) return NextResponse.json({ error: error.message || "Order could not be created." }, { status: 400 });
    const id = typeof data === "string" ? data : Array.isArray(data) ? data[0] : null;
    if (typeof id !== "string" || !UUID.test(id)) return NextResponse.json({ error: "Order could not be created." }, { status: 500 });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("freelance order creation failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Order could not be created. Please try again." }, { status: 500 });
  }
}

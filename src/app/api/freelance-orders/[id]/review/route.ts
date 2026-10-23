import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });
    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }
    const values = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
    const rating = values.rating;
    const comment = typeof values.comment === "string" ? values.comment.trim() : "";
    if (!Number.isInteger(rating) || Number(rating) < 1 || Number(rating) > 5 || comment.length > 1000) {
      return NextResponse.json({ error: "Choose a rating from 1 to 5 and keep the comment within 1000 characters." }, { status: 400 });
    }
    const order = await supabase.from("freelancer_orders").select("profile_id,status,client_user_id").eq("id", id).maybeSingle();
    if (order.error) return NextResponse.json({ error: order.error.message }, { status: 400 });
    if (!order.data || order.data.client_user_id !== user.id) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.data.status !== "completed") return NextResponse.json({ error: "A review can be added only after the order is completed." }, { status: 400 });
    const existing = await supabase.from("freelancer_reviews").select("id").eq("order_id", id).maybeSingle();
    if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 400 });
    if (existing.data) return NextResponse.json({ error: "A review has already been submitted for this order." }, { status: 400 });
    const { error } = await supabase.from("freelancer_reviews").insert({
      order_id: id, profile_id: order.data.profile_id, rating: Number(rating), comment,
    });
    if (error) return NextResponse.json({ error: /duplicate|unique/i.test(error.message) ? "A review has already been submitted for this order." : error.message }, { status: 400 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("freelance order review failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "Review could not be submitted." }, { status: 500 });
  }
}

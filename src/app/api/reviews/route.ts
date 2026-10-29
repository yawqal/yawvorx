import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limited = rateLimit(request, "product-review-post", 5, 60_000);
  if (limited) return limited;
  const user = await requireUser("/shop");
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4096) return NextResponse.json({ error: "Review request is too large." }, { status: 413 });

  let payload: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: "Review request is too large." }, { status: 413 });
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON request body." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
  }

  const record = payload as Record<string, unknown>;
  const productId = record.product_id;
  const rating = record.rating;
  const body = record.body;
  if (typeof productId !== "string" || !/^[0-9a-f-]{36}$/i.test(productId) ||
      typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
      typeof body !== "string" || body.trim().length < 10 || body.trim().length > 2000) {
    return NextResponse.json({ error: "Enter a valid product, a rating from 1 to 5, and a review between 10 and 2,000 characters." }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Product reviews are not configured." }, { status: 503 });
  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId, user_id: user.id, rating, body: body.trim(),
  });
  if (error?.code === "23505") {
    return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 });
  }
  if (error?.code === "42501") {
    return NextResponse.json({ error: "A verified paid purchase is required before reviewing this product." }, { status: 403 });
  }
  if (error) {
    console.error("Product review submission failed");
    return NextResponse.json({ error: "Your review could not be saved. Please try again later." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}

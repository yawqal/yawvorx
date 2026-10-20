import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
type SupabaseClient = NonNullable<ReturnType<typeof getSupabaseServerClient>>;
type VendorSession = { supabase: SupabaseClient; userId: string };
type SessionResult = { session: VendorSession; response?: never } | { session?: never; response: NextResponse };
type ProductFields = {
  name: string; slug: string; description: string; price: number; currency: "ETB" | "USD";
  price_etb: number | null; price_usd: number | null; stock: number; category_id: number | null;
};

async function getActiveVendor(): Promise<SessionResult> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { response: NextResponse.json({ error: "Database is not configured." }, { status: 503 }) };
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { response: NextResponse.json({ error: "Sign in to manage vendor products." }, { status: 401 }) };
  const { data: vendor, error } = await supabase.from("vendor_profiles").select("status")
    .eq("user_id", authData.user.id).maybeSingle();
  if (error) return { response: NextResponse.json({ error: `Vendor account status could not be checked: ${error.message}` }, { status: 500 }) };
  if (!vendor || vendor.status !== "active") return { response: NextResponse.json({ error: "Your vendor account is not active." }, { status: 403 }) };
  return { session: { supabase, userId: authData.user.id } };
}

function parseFields(body: Record<string, unknown>): ProductFields | string {
  const allowed = new Set(["name", "slug", "description", "price", "currency", "price_etb", "price_usd", "stock", "category_id"]);
  if (Object.keys(body).some((key) => !allowed.has(key))) return "Only product fields may be submitted.";
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120) return "Name is required and must be at most 120 characters.";
  if (typeof body.slug !== "string" || body.slug.length > 100 || !SLUG.test(body.slug)) return "Slug must use lowercase letters, numbers, and single hyphens.";
  if (typeof body.description !== "string" || body.description.length > 5000) return "Description must be text and at most 5000 characters.";
  const parseMoney = (value: unknown, maximum: number): number | undefined => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!/^\d+(?:\.\d{1,2})?$/.test(trimmed)) return undefined;
      value = Number(trimmed);
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > maximum || Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) return undefined;
    return value;
  };
  const price = parseMoney(body.price, 1_000_000_000_000);
  if (price === undefined) return "Price must be a number from 0 to 1,000,000,000,000 with at most two decimal places.";
  if (body.currency !== "ETB" && body.currency !== "USD") return "Currency must be ETB or USD.";
  const stockValue = typeof body.stock === "string" && /^\d+$/.test(body.stock.trim()) ? Number(body.stock.trim()) : body.stock;
  if (typeof stockValue !== "number" || !Number.isSafeInteger(stockValue) || stockValue < 0 || stockValue > 1_000_000_000) return "Stock must be a whole number from 0 to 1,000,000,000.";
  let categoryId: number | null = null;
  if (body.category_id !== null && body.category_id !== "") {
    if (typeof body.category_id !== "number" || !Number.isSafeInteger(body.category_id) || body.category_id < 1) return "Choose a valid category.";
    categoryId = body.category_id;
  }
  const parseDual = (value: unknown): number | null | undefined => {
    if (value === null || value === "" || value === undefined) return null;
    return parseMoney(value, 9_999_999_999.99);
  };
  const priceETB = parseDual(body.price_etb);
  const priceUSD = parseDual(body.price_usd);
  if (priceETB === undefined || priceUSD === undefined || ((priceETB === null) !== (priceUSD === null))) return "Enter both dual prices, or leave both blank.";
  return {
    name: body.name.trim(), slug: body.slug, description: body.description.trim(), price,
    currency: body.currency, price_etb: priceETB, price_usd: priceUSD, stock: stockValue, category_id: categoryId,
  };
}

async function validCategory(supabase: SupabaseClient, categoryId: number | null): Promise<{ valid: boolean; error?: string }> {
  if (categoryId === null) return { valid: true };
  const { data, error } = await supabase.from("categories").select("id").eq("id", categoryId).maybeSingle();
  if (error) return { valid: false, error: `Category could not be checked: ${error.message}` };
  return { valid: data !== null };
}

function saveError(error: { code?: string; message: string }) {
  if (error.code === "23505") return NextResponse.json({ error: "That product slug is already in use. Choose another slug." }, { status: 409 });
  return NextResponse.json({ error: `Product could not be saved: ${error.message}` }, { status: 400 });
}

async function readBody(request: Request): Promise<Record<string, unknown> | NextResponse> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return NextResponse.json({ error: "Request body must be a JSON object." }, { status: 400 });
    return value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const result = await getActiveVendor();
  if (result.response) return result.response;
  const body = await readBody(request);
  if (body instanceof NextResponse) return body;
  const fields = parseFields(body);
  if (typeof fields === "string") return NextResponse.json({ error: fields }, { status: 400 });
  const categoryCheck = await validCategory(result.session.supabase, fields.category_id);
  if (categoryCheck.error) return NextResponse.json({ error: categoryCheck.error }, { status: 500 });
  if (!categoryCheck.valid) return NextResponse.json({ error: "The selected category was not found." }, { status: 400 });
  const { data, error } = await result.session.supabase.from("products").insert({
    ...fields, vendor_id: result.session.userId, product_type: "physical", is_demo: false,
    is_published: false, approval_status: "draft",
  }).select("id").single();
  if (error) return saveError(error);
  return NextResponse.json({ ok: true, id: data.id, message: "Draft product created." }, { status: 201 });
}

export async function PATCH(request: Request) {
  const result = await getActiveVendor();
  if (result.response) return result.response;
  const body = await readBody(request);
  if (body instanceof NextResponse) return body;
  if (typeof body.id !== "string" || !UUID.test(body.id)) return NextResponse.json({ error: "A valid product UUID is required." }, { status: 400 });
  if (body.vendor_id !== undefined || body.approval_status !== undefined || body.is_published !== undefined) {
    return NextResponse.json({ error: "Ownership, approval status, and publication status cannot be submitted directly." }, { status: 400 });
  }

  const { data: product, error: lookupError } = await result.session.supabase.from("products")
    .select("id,approval_status").eq("id", body.id).eq("vendor_id", result.session.userId).maybeSingle();
  if (lookupError) return NextResponse.json({ error: `Product could not be checked: ${lookupError.message}` }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Product was not found." }, { status: 404 });
  if (product.approval_status !== "draft" && product.approval_status !== "rejected") {
    return NextResponse.json({ error: "Only draft or rejected products can be edited or submitted." }, { status: 409 });
  }

  if (body.action === "submit") {
    if (Object.keys(body).some((key) => key !== "id" && key !== "action")) return NextResponse.json({ error: "Submit action accepts only the product UUID." }, { status: 400 });
    const { data, error } = await result.session.supabase.from("products").update({
      vendor_id: result.session.userId, approval_status: "pending", is_published: false,
    }).eq("id", body.id).eq("vendor_id", result.session.userId).select("id").maybeSingle();
    if (error) return saveError(error);
    if (!data) return NextResponse.json({ error: "Product could not be submitted. It may no longer be editable." }, { status: 409 });
    return NextResponse.json({ ok: true, message: "Product submitted for approval." });
  }
  if (body.action !== undefined) return NextResponse.json({ error: "Action must be submit or omitted when editing." }, { status: 400 });
  const { id, ...input } = body;
  const fields = parseFields(input);
  if (typeof fields === "string") return NextResponse.json({ error: fields }, { status: 400 });
  const categoryCheck = await validCategory(result.session.supabase, fields.category_id);
  if (categoryCheck.error) return NextResponse.json({ error: categoryCheck.error }, { status: 500 });
  if (!categoryCheck.valid) return NextResponse.json({ error: "The selected category was not found." }, { status: 400 });
  const { data, error } = await result.session.supabase.from("products").update({
    ...fields, vendor_id: result.session.userId, approval_status: "draft", is_published: false,
  }).eq("id", id).eq("vendor_id", result.session.userId).select("id").maybeSingle();
  if (error) return saveError(error);
  if (!data) return NextResponse.json({ error: "Product could not be saved. It may no longer be editable." }, { status: 409 });
  return NextResponse.json({ ok: true, message: "Product saved." });
}

export async function DELETE(request: Request) {
  const result = await getActiveVendor();
  if (result.response) return result.response;
  const body = await readBody(request);
  if (body instanceof NextResponse) return body;
  if (Object.keys(body).some((key) => key !== "id") || typeof body.id !== "string" || !UUID.test(body.id)) {
    return NextResponse.json({ error: "A valid product UUID is required." }, { status: 400 });
  }
  const { data, error } = await result.session.supabase.from("products").delete()
    .eq("id", body.id).eq("vendor_id", result.session.userId).in("approval_status", ["draft", "rejected"]).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: `Product could not be deleted: ${error.message}` }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Only your draft or rejected products can be deleted." }, { status: 409 });
  return NextResponse.json({ ok: true, message: "Product deleted." });
}

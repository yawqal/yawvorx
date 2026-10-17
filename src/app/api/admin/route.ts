import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max
    ? value.trim()
    : null;

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function audit(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  details: Record<string, string | number | boolean | null>,
) {
  const { error } = await supabase.from("audit_log").insert({
    actor_id: actorId, action, entity, entity_id: entityId, details,
  });
  return error;
}

export async function POST(request: Request) {
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return fail("Database is not configured.", 503);

  let body: Record<string, unknown>;
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail("Invalid request body.");
    body = value as Record<string, unknown>;
  } catch {
    return fail("Invalid JSON request body.");
  }

  const action = text(body.action, 40);
  if (!action) return fail("An action is required.");

  if (action === "save_product") {
    const id = typeof body.id === "string" ? body.id : null;
    const name = text(body.name, 120);
    const slugRaw = text(body.slug, 100)?.toLowerCase() ?? "";
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugRaw) ? slugRaw : null;
    const price = Number(body.price);
    const stock = Number(body.stock);
    const currency = body.currency;
    const productType = body.product_type;
    const description = typeof body.description === "string" && body.description.length <= 5000 ? body.description.trim() : null;
    const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
    const categoryId = body.category_id === "" || body.category_id === null ? null : Number(body.category_id);
    if (!name || !slug || description === null || !Number.isFinite(price) || price < 0 ||
        !Number.isInteger(stock) || stock < 0 || !["ETB", "USD"].includes(String(currency)) ||
        !["physical", "digital"].includes(String(productType)) ||
        (imageUrl && imageUrl.length > 1000) ||
        (categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1))) {
      return fail("Check the product fields and try again.");
    }
    const values = {
      name, slug, description, price, currency, stock,
      image_url: imageUrl || null,
      category_id: categoryId,
      product_type: productType,
      is_demo: body.is_demo === true,
      is_published: body.is_published === true,
    };
    const result = id
      ? await supabase.from("products").update(values).eq("id", id).select("id").maybeSingle()
      : await supabase.from("products").insert(values).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Product was not saved.", 400);
    const logError = await audit(supabase, actor.id, id ? "product.updated" : "product.created", "product", result.data.id, { name, slug });
    if (logError) return fail(`Product saved, but audit logging failed: ${logError.message}`, 500);
    return NextResponse.json({ ok: true, id: result.data.id });
  }

  if (action === "deactivate_product") {
    const id = text(body.id, 80);
    if (!id) return fail("A product id is required.");
    const { error } = await supabase.from("products").update({ is_published: false }).eq("id", id);
    if (error) return fail(error.message);
    const logError = await audit(supabase, actor.id, "product.deactivated", "product", id, {});
    return logError ? fail(`Product deactivated, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  if (action === "save_category") {
    const id = typeof body.id === "string" ? body.id : null;
    const name = text(body.name, 80);
    const slugRaw = text(body.slug, 100)?.toLowerCase() ?? "";
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugRaw) ? slugRaw : null;
    if (!name || !slug) return fail("Enter a category name and a lowercase URL slug.");
    const result = id
      ? await supabase.from("categories").update({ name, slug }).eq("id", id).select("id").maybeSingle()
      : await supabase.from("categories").insert({ name, slug }).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Category was not saved.");
    const logError = await audit(supabase, actor.id, id ? "category.updated" : "category.created", "category", String(result.data.id), { name, slug });
    return logError ? fail(`Category saved, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  if (action === "save_variant_stock") {
    const id = text(body.id, 80);
    const productId = text(body.product_id, 80);
    const stock = Number(body.stock);
    if (!id || !productId || !Number.isInteger(stock) || stock < 0) return fail("Enter a valid variant stock quantity.");
    const { error } = await supabase.from("product_variants").update({ stock }).eq("id", id).eq("product_id", productId);
    if (error) return fail(error.message);
    const logError = await audit(supabase, actor.id, "variant.stock_updated", "product_variant", id, { stock });
    return logError ? fail(`Stock saved, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  if (action === "change_order_status") {
    const id = text(body.id, 80);
    const next = text(body.status, 30);
    if (!id || !next) return fail("An order id and status are required.");
    const { data: order, error: readError } = await supabase.from("orders").select("id,status").eq("id", id).maybeSingle();
    if (readError || !order) return fail(readError?.message ?? "Order not found.", 404);
    if (!ORDER_TRANSITIONS[order.status]?.includes(next)) return fail("That order status transition is not allowed.");
    const { error } = await supabase.from("orders").update({ status: next }).eq("id", id);
    if (error) return fail(error.message);
    const logError = await audit(supabase, actor.id, "order.status_changed", "order", id, { from: order.status, to: next });
    return logError ? fail(`Order updated, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  if (action === "add_order_note") {
    const id = text(body.id, 80);
    const note = text(body.note, 2000);
    if (!id || !note) return fail("An order id and note are required.");
    const { data: order, error: readError } = await supabase.from("orders").select("id,status").eq("id", id).maybeSingle();
    if (readError || !order) return fail(readError?.message ?? "Order not found.", 404);
    const { error } = await supabase.from("order_status_history").insert({
      order_id: id, from_status: order.status, to_status: order.status, changed_by: actor.id, note,
    });
    if (error) return fail(error.message);
    const logError = await audit(supabase, actor.id, "order.note_added", "order", id, {});
    return logError ? fail(`Note saved, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  if (action === "review_payment") {
    const id = text(body.id, 80);
    const status = body.status;
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!id || !["verified", "rejected"].includes(String(status)) || reference.length > 200 || note.length > 2000) {
      return fail("Check the payment review fields and try again.");
    }
    const { data: order, error: readError } = await supabase.from("orders")
      .select("id,total,payment_method,payment_status").eq("id", id).maybeSingle();
    if (readError || !order) return fail(readError?.message ?? "Order not found.", 404);
    if (order.payment_status === "paid") return fail("A paid order cannot be reviewed again.");
    const { data: payment, error: paymentReadError } = await supabase.from("manual_payments")
      .select("id,status").eq("order_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (paymentReadError) return fail(paymentReadError.message);
    if (payment?.status === "verified") return fail("This payment has already been verified.");
    const payload = {
      order_id: id,
      amount: Number(order.total),
      method: order.payment_method === "manual" ? "manual" : "manual payment",
      reference: reference || null,
      status,
      verified_by: status === "verified" ? actor.id : null,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      note: note || null,
    };
    const paymentResult = payment
      ? await supabase.from("manual_payments").update(payload).eq("id", payment.id)
      : await supabase.from("manual_payments").insert(payload);
    if (paymentResult.error) return fail(paymentResult.error.message);
    if (status === "verified") {
      const { error } = await supabase.from("orders").update({ payment_status: "paid" }).eq("id", id);
      if (error) return fail(`Payment marked verified, but order payment status was not updated: ${error.message}`, 500);
    }
    const logError = await audit(supabase, actor.id, `payment.${status}`, "order", id, { reference: reference || null, note: note || null });
    return logError ? fail(`Payment reviewed, but audit logging failed: ${logError.message}`, 500) : NextResponse.json({ ok: true });
  }

  return fail("Unknown admin action.");
}

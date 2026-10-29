import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { isMissingDualPriceColumns } from "@/lib/products-db";
import { randomBytes } from "node:crypto";

const ADMIN_ACTIONS = new Set([
  "save_product", "deactivate_product", "save_category", "save_service", "deactivate_service",
  "save_project", "deactivate_project", "update_request_status", "support_reply", "support_status",
  "save_variant_stock", "save_digital_file", "change_order_status", "add_order_note", "review_payment", "moderate_review", "review_vendor",
]);

const ORDER_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};
const REQUEST_TRANSITIONS: Record<string, string[]> = {
  new: ["reviewing", "rejected"],
  reviewing: ["in_progress", "rejected"],
  in_progress: ["completed", "rejected"],
  completed: [],
  rejected: [],
};

const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim().length > 0 && value.trim().length <= max
    ? value.trim()
    : null;
const stringList = (value: unknown, maxItems: number, maxLength: number): string[] | null => {
  const items = typeof value === "string" ? value.split(/\r?\n/) : value;
  if (!Array.isArray(items) || items.length > maxItems || items.some((item) => typeof item !== "string" || item.trim().length > maxLength)) return null;
  return items.map((item) => item.trim()).filter(Boolean);
};

function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function audit(
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  actorId: string,
  action: string,
  tableName: string,
  recordId: string,
  newData: Record<string, string | number | boolean | null>,
  oldData: Record<string, string | number | boolean | null> | null = null,
  reason: string | null = null,
): Promise<string | null> {
  try {
    const { error } = await supabase.from("audit_log").insert({
      actor: actorId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
      reason,
    });
    if (error) {
      console.error("Audit log insert failed", { action, tableName, recordId });
      return "The action succeeded, but the audit log could not be written.";
    }
    return null;
  } catch (error) {
    console.error("Audit log insert failed", { action, tableName, recordId });
    return "The action succeeded, but the audit log could not be written.";
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "admin-post", 60, 60_000);
  if (limited) return limited;
  const actor = await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) return fail("Database is not configured.", 503);

  let body: Record<string, unknown>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 20_000) return fail("Request body is too large.", 413);
    const value: unknown = JSON.parse(rawBody);
    if (!value || typeof value !== "object" || Array.isArray(value)) return fail("Invalid request body.");
    body = value as Record<string, unknown>;
  } catch {
    return fail("Invalid JSON request body.");
  }

  const action = text(body.action, 40);
  if (!action) return fail("An action is required.");
  if (!ADMIN_ACTIONS.has(action)) return fail("Unknown admin action.");

  const id = body.id === "" ? undefined : body.id;
  if (id !== undefined && (typeof id !== "string" || id.length > 80 || !/^[A-Za-z0-9_-]+$/.test(id))) {
    return fail("The record id is invalid.");
  }
  for (const flag of ["is_demo", "is_published", "is_hidden"]) {
    if (body[flag] !== undefined && typeof body[flag] !== "boolean") return fail(`The ${flag.replace("_", " ")} value must be true or false.`);
  }

  if (action === "save_product") {
    const recordId = typeof id === "string" ? id : null;
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
    if (!name || !slug || description === null ||
        (typeof body.price !== "number" && (typeof body.price !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(body.price.trim()))) ||
        (typeof body.stock !== "number" && (typeof body.stock !== "string" || !/^\d+$/.test(body.stock.trim()))) ||
        !Number.isFinite(price) || price < 0 || price > 1_000_000_000_000 ||
        !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000_000 || !["ETB", "USD"].includes(String(currency)) ||
        !["physical", "digital"].includes(String(productType)) ||
        (body.image_url !== undefined && typeof body.image_url !== "string") ||
        (imageUrl && (imageUrl.length > 1000 || (!/^https:\/\//i.test(imageUrl) && !(imageUrl.startsWith("/") && !imageUrl.startsWith("//"))))) ||
        (categoryId !== null && (!Number.isInteger(categoryId) || categoryId < 1))) {
      return fail("Check the product fields and try again.");
    }
    const hasDualPriceInput = body.price_etb !== undefined || body.price_usd !== undefined;
    const parseDualPrice = (value: unknown): number | null | undefined => {
      if (value === null || value === "") return null;
      if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(?:\.\d{1,2})?$/.test(value.trim()))) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 9_999_999_999.99 ? parsed : undefined;
    };
    const priceETB = parseDualPrice(body.price_etb);
    const priceUSD = parseDualPrice(body.price_usd);
    if (hasDualPriceInput && (priceETB === undefined || priceUSD === undefined ||
        ((priceETB === null) !== (priceUSD === null)))) {
      return fail("Enter both dual prices, or leave both blank.");
    }
    let dualPriceValues: { price_etb?: number | null; price_usd?: number | null } = {};
    if (hasDualPriceInput) {
      const probe = await supabase.from("products").select("price_etb,price_usd").limit(1);
      if (isMissingDualPriceColumns(probe.error)) {
        if (priceETB !== null || priceUSD !== null) return fail("Dual-price columns are not installed; review the pricing proposal first.", 409);
      } else if (probe.error) {
        console.error("Dual-price column check failed");
        return fail("Product pricing configuration could not be checked.", 500);
      } else {
        dualPriceValues = { price_etb: priceETB ?? null, price_usd: priceUSD ?? null };
      }
    }
    const values = {
      name, slug, description, price, currency, stock,
      image_url: imageUrl || null,
      category_id: categoryId,
      product_type: productType,
      is_demo: body.is_demo === true,
      is_published: body.is_published === true,
      ...dualPriceValues,
    };
    const result = recordId
      ? await supabase.from("products").update(values).eq("id", recordId).select("id").maybeSingle()
      : await supabase.from("products").insert(values).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Product was not saved.", 400);
    const warning = await audit(supabase, actor.id, recordId ? "product.updated" : "product.created", "products", result.data.id, { name, slug });
    return NextResponse.json({ ok: true, id: result.data.id, ...(warning ? { warning } : {}) });
  }

  if (action === "deactivate_product") {
    const id = text(body.id, 80);
    if (!id) return fail("A product id is required.");
    const { error } = await supabase.from("products").update({ is_published: false }).eq("id", id);
    if (error) return fail(error.message);
    const warning = await audit(supabase, actor.id, "product.deactivated", "products", id, { is_published: false });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "save_category") {
    const recordId = typeof id === "string" ? id : null;
    const name = text(body.name, 80);
    const slugRaw = text(body.slug, 100)?.toLowerCase() ?? "";
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugRaw) ? slugRaw : null;
    if (!name || !slug) return fail("Enter a category name and a lowercase URL slug.");
    const result = recordId
      ? await supabase.from("categories").update({ name, slug }).eq("id", recordId).select("id").maybeSingle()
      : await supabase.from("categories").insert({ name, slug }).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Category was not saved.");
    const warning = await audit(supabase, actor.id, recordId ? "category.updated" : "category.created", "categories", String(result.data.id), { name, slug });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "save_service") {
    const recordId = typeof id === "string" ? id : null;
    const title = text(body.title, 120);
    const slugRaw = text(body.slug, 100)?.toLowerCase() ?? "";
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugRaw) ? slugRaw : null;
    const description = typeof body.description === "string" && body.description.length <= 3000 ? body.description.trim() : null;
    const deliverables = stringList(body.deliverables, 30, 200);
    if (!title || !slug || description === null || !deliverables) return fail("Check the service fields and try again.");
    const values = { title, slug, description, deliverables, is_published: body.is_published === true };
    const result = recordId
      ? await supabase.from("services").update(values).eq("id", recordId).select("id").maybeSingle()
      : await supabase.from("services").insert(values).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Service was not saved.");
    const warning = await audit(supabase, actor.id, recordId ? "service.updated" : "service.created", "services", result.data.id, { title, slug });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "deactivate_service") {
    const id = text(body.id, 80);
    if (!id) return fail("A service id is required.");
    const { error } = await supabase.from("services").update({ is_published: false }).eq("id", id);
    if (error) return fail(error.message);
    const warning = await audit(supabase, actor.id, "service.deactivated", "services", id, { is_published: false });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "save_project") {
    const recordId = typeof id === "string" ? id : null;
    const title = text(body.title, 120);
    const slugRaw = text(body.slug, 100)?.toLowerCase() ?? "";
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugRaw) ? slugRaw : null;
    const category = typeof body.category === "string" && body.category.length <= 80 ? body.category.trim() || null : null;
    const summary = typeof body.summary === "string" && body.summary.length <= 1000 ? body.summary.trim() : null;
    const brief = typeof body.brief === "string" && body.brief.length <= 4000 ? body.brief.trim() : null;
    const approach = typeof body.approach === "string" && body.approach.length <= 4000 ? body.approach.trim() : null;
    const deliverables = stringList(body.deliverables, 30, 200);
    const tags = stringList(body.tags, 30, 60);
    const liveUrlValue = typeof body.live_url === "string" ? body.live_url.trim() : "";
    const liveUrl = liveUrlValue ? text(liveUrlValue, 1000) : null;
    const coverImagePathValue = typeof body.cover_image_path === "string" ? body.cover_image_path.trim() : "";
    const coverImagePath = coverImagePathValue ? text(coverImagePathValue, 500) : null;
    if (!title || !slug || category === null || summary === null || brief === null || approach === null || !deliverables || !tags ||
        (body.live_url !== undefined && typeof body.live_url !== "string") ||
        (body.cover_image_path !== undefined && typeof body.cover_image_path !== "string") ||
        (liveUrlValue && (!liveUrl || !/^https?:\/\//i.test(liveUrl))) ||
        (coverImagePathValue && (!coverImagePath || coverImagePath.startsWith("/") || coverImagePath.includes("..")))) {
      return fail("Check the portfolio fields and try again.");
    }
    const values = {
      title, slug, category, summary, brief, approach, deliverables, tags,
      live_url: liveUrl, cover_image_path: coverImagePath,
      is_demo: body.is_demo === true, is_published: body.is_published === true,
    };
    const result = recordId
      ? await supabase.from("portfolio_projects").update(values).eq("id", recordId).select("id").maybeSingle()
      : await supabase.from("portfolio_projects").insert(values).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Portfolio project was not saved.");
    const warning = await audit(supabase, actor.id, recordId ? "portfolio.updated" : "portfolio.created", "portfolio_projects", result.data.id, { title, slug });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "deactivate_project") {
    const id = text(body.id, 80);
    if (!id) return fail("A project id is required.");
    const { error } = await supabase.from("portfolio_projects").update({ is_published: false }).eq("id", id);
    if (error) return fail(error.message);
    const warning = await audit(supabase, actor.id, "portfolio.deactivated", "portfolio_projects", id, { is_published: false });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "update_request_status") {
    const id = text(body.id, 80);
    const next = text(body.status, 30);
    if (!id || !next) return fail("A request id and status are required.");
    const { data: serviceRequest, error: readError } = await supabase.from("service_requests").select("id,status").eq("id", id).maybeSingle();
    if (readError || !serviceRequest) return fail(readError?.message ?? "Service request not found.", 404);
    if (!REQUEST_TRANSITIONS[serviceRequest.status]?.includes(next)) return fail("That service request status transition is not allowed.");
    const { error } = await supabase.from("service_requests").update({ status: next }).eq("id", id);
    if (error) return fail(error.message);
    const warning = await audit(supabase, actor.id, "service_request.status_changed", "service_requests", id, { status: next }, { status: serviceRequest.status });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "support_reply") {
    const id = text(body.id, 80);
    const message = text(body.message, 4000);
    if (!id || !message) return fail("A support ticket id and reply are required.");
    const { data: ticket, error: readError } = await supabase.from("support_tickets")
      .select("id,user_id,status,subject").eq("id", id).maybeSingle();
    if (readError || !ticket) return fail(readError?.message ?? "Support ticket not found.", 404);
    if (ticket.status === "closed") return fail("Reopen the ticket before replying.");
    const { error } = await supabase.from("support_messages").insert({ ticket_id: id, sender_id: actor.id, body: message });
    if (error) return fail(error.message);
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: ticket.user_id, title: "Support replied", body: `There is a new reply on "${ticket.subject}".`, href: "/account#support",
    });
    if (notificationError) return fail(`Reply sent, but the customer notification could not be saved: ${notificationError.message}`, 500);
    const warning = await audit(supabase, actor.id, "support.reply_sent", "support_tickets", id, { reply_added: true }, { status: ticket.status });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "support_status") {
    const id = text(body.id, 80);
    const next = text(body.status, 30);
    if (!id || !next) return fail("A support ticket id and status are required.");
    const { data: ticket, error: readError } = await supabase.from("support_tickets")
      .select("id,user_id,status,subject").eq("id", id).maybeSingle();
    if (readError || !ticket) return fail(readError?.message ?? "Support ticket not found.", 404);
    const allowed: Record<string, string[]> = { open: ["in_progress", "closed"], in_progress: ["open", "closed"], closed: ["open"] };
    if (!allowed[ticket.status]?.includes(next)) return fail("That support ticket status transition is not allowed.");
    const now = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update({
      status: next, closed_at: next === "closed" ? now : null,
    }).eq("id", id);
    if (error) return fail(error.message);
    const { error: notificationError } = await supabase.from("notifications").insert({
      user_id: ticket.user_id, title: "Support ticket updated", body: `"${ticket.subject}" is now ${next.replace(/_/g, " ")}.`, href: "/account#support",
    });
    if (notificationError) return fail(`Ticket updated, but the customer notification could not be saved: ${notificationError.message}`, 500);
    const warning = await audit(supabase, actor.id, "support.status_changed", "support_tickets", id, { status: next }, { status: ticket.status });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "save_variant_stock") {
    const id = text(body.id, 80);
    const productId = text(body.product_id, 80);
    const stock = Number(body.stock);
    if (!id || !productId ||
        (typeof body.stock !== "number" && (typeof body.stock !== "string" || !/^\d+$/.test(body.stock.trim()))) ||
        !Number.isSafeInteger(stock) || stock < 0 || stock > 1_000_000_000) return fail("Enter a valid variant stock quantity.");
    const { error } = await supabase.from("product_variants").update({ stock }).eq("id", id).eq("product_id", productId);
    if (error) return fail(error.message);
    const warning = await audit(supabase, actor.id, "variant.stock_updated", "product_variants", id, { stock });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "save_digital_file") {
    const recordId = typeof id === "string" ? id : null;
    const productId = text(body.product_id, 80);
    const fileName = text(body.file_name, 255);
    const storagePath = text(body.storage_path, 500);
    if (body.variant_id !== undefined && body.variant_id !== null &&
        (typeof body.variant_id !== "string" || body.variant_id.length > 80 || (body.variant_id && !/^[A-Za-z0-9_-]+$/.test(body.variant_id)))) {
      return fail("The variant id is invalid.");
    }
    const variantId = typeof body.variant_id === "string" && body.variant_id ? body.variant_id : null;
    if (!productId || !fileName || !storagePath || storagePath.startsWith("/") || storagePath.includes("\\") ||
        storagePath.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
      return fail("Enter a file name and a valid relative path in the private digital-files bucket.");
    }
    const { data: product, error: productError } = await supabase.from("products")
      .select("id,product_type").eq("id", productId).maybeSingle();
    if (productError || !product) return fail(productError?.message ?? "Product not found.", 404);
    if (product.product_type !== "digital") return fail("Only digital products can have downloadable files.");
    const values = {
      product_id: productId, variant_id: variantId, storage_bucket: "digital-files",
      storage_path: storagePath, file_name: fileName,
    };
    const result = recordId
      ? await supabase.from("digital_files").update(values).eq("id", recordId).eq("product_id", productId).select("id").maybeSingle()
      : await supabase.from("digital_files").insert(values).select("id").single();
    if (result.error || !result.data) return fail(result.error?.message ?? "Digital file reference was not saved.");
    const warning = await audit(supabase, actor.id, recordId ? "digital_file.updated" : "digital_file.attached", "digital_files", result.data.id, { product_id: productId, storage_path: storagePath });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
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
    const warning = await audit(supabase, actor.id, "order.status_changed", "orders", id, { status: next }, { status: order.status });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
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
    const warning = await audit(supabase, actor.id, "order.note_added", "orders", id, { note }, { status: order.status }, note);
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "review_payment") {
    const id = text(body.id, 80);
    const status = body.status;
    const reference = typeof body.reference === "string" ? body.reference.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    if (!id || !["verified", "rejected"].includes(String(status)) ||
        (body.reference !== undefined && typeof body.reference !== "string") ||
        (body.note !== undefined && typeof body.note !== "string") ||
        reference.length > 200 || note.length > 2000) {
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
    const warning = await audit(supabase, actor.id, `payment.${status}`, "orders", id,
      { payment_status: status === "verified" ? "paid" : order.payment_status, reference: reference || null, note: note || null },
      { payment_status: order.payment_status, manual_payment_status: payment?.status ?? null }, note || null);
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "moderate_review") {
    const reviewId = text(id, 80);
    if (!reviewId || typeof body.is_hidden !== "boolean") return fail("A review id and hidden true/false value are required.");
    const { data, error } = await supabase.from("product_reviews")
      .update({ is_hidden: body.is_hidden }).eq("id", reviewId).select("id").maybeSingle();
    if (error || !data) return fail("The review could not be updated. Confirm the product reviews SQL has been applied.", error ? 500 : 404);
    const warning = await audit(supabase, actor.id, body.is_hidden ? "product_review.hidden" : "product_review.unhidden", "product_reviews", reviewId, { is_hidden: body.is_hidden });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  if (action === "review_vendor") {
    const applicationId = text(id, 80);
    const status = text(body.status, 20);
    if (!applicationId || !["pending", "approved", "rejected"].includes(String(status))) {
      return fail("A vendor application id and valid review status are required.");
    }
    const { data: application, error: readError } = await supabase.from("vendor_applications")
      .select("id,user_id,status,referral_code").eq("id", applicationId).maybeSingle();
    if (readError || !application) return fail("Vendor application could not be found. Confirm the vendor SQL proposal is installed.", readError ? 500 : 404);
    const reviewedAt = new Date().toISOString();
    const { error: updateError } = await supabase.from("vendor_applications").update({
      status, reviewed_by: actor.id, reviewed_at: reviewedAt,
    }).eq("id", applicationId);
    if (updateError) return fail("Vendor application status could not be updated.", 500);

    if (status === "approved") {
      let referralCode = application.referral_code as string | null;
      if (referralCode) {
        const { data, error } = await supabase.from("affiliate_codes").select("id").eq("code", referralCode).maybeSingle();
        if (error) return fail("Application approved, but the referral code could not be checked. Retry the review.", 500);
        if (!data) referralCode = null;
      }
      if (!referralCode) {
        let created = false;
        for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
          const code = randomBytes(5).toString("hex").toUpperCase();
          const { error } = await supabase.from("affiliate_codes").insert({
            code, is_active: false,
          });
          if (!error) {
            referralCode = code;
            created = true;
          }
          else if (error.code !== "23505") {
            console.error("Affiliate code creation failed");
            return fail("Application approved, but the referral code could not be created. Retry the review.", 500);
          }
        }
        if (!created) return fail("Application approved, but a unique referral code could not be created. Retry the review.", 500);
        const { error } = await supabase.from("vendor_applications")
          .update({ referral_code: referralCode }).eq("id", applicationId);
        if (error) return fail("Application approved, but its referral code could not be linked. Retry the review.", 500);
      }
      const { error } = await supabase.from("affiliate_codes").update({ is_active: true }).eq("code", referralCode);
      if (error) return fail("Application approved, but the referral code could not be activated. Retry the review.", 500);
    } else {
      if (application.referral_code) {
        const { error } = await supabase.from("affiliate_codes").update({ is_active: false }).eq("code", application.referral_code);
        if (error) return fail("Application status changed, but its referral code could not be deactivated.", 500);
      }
    }
    const warning = await audit(supabase, actor.id, "vendor_application.reviewed", "vendor_applications", applicationId, { status });
    return NextResponse.json({ ok: true, ...(warning ? { warning } : {}) });
  }

  return fail("Unknown admin action.");
}

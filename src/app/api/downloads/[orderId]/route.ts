import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { orderId: string } }) {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(params.orderId)) {
    return NextResponse.json({ error: "The order id is invalid." }, { status: 400 });
  }
  const user = await requireUser(`/account/orders/${encodeURIComponent(params.orderId)}`);
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Downloads are not configured." }, { status: 503 });

  const { data: order, error: orderError } = await supabase.from("orders")
    .select("id,payment_status").eq("id", params.orderId).eq("user_id", user.id).maybeSingle();
  if (orderError) return NextResponse.json({ error: "Could not verify order access." }, { status: 500 });
  if (!order || order.payment_status !== "paid") return NextResponse.json({ error: "No verified digital purchase was found." }, { status: 404 });

  const { data: items, error: itemsError } = await supabase.from("order_items")
    .select("product_id,variant_id,product_type").eq("order_id", order.id).eq("product_type", "digital");
  if (itemsError) return NextResponse.json({ error: "Could not load the order items." }, { status: 500 });
  const productIds = [...new Set((items ?? []).flatMap((item) => item.product_id ? [item.product_id] : []))];
  if (productIds.length === 0) return NextResponse.json({ error: "This order has no digital products." }, { status: 404 });

  const { data: files, error: filesError } = await supabase.from("digital_files")
    .select("product_id,variant_id,storage_bucket,storage_path,file_name")
    .in("product_id", productIds);
  if (filesError) return NextResponse.json({ error: "Could not load digital file references." }, { status: 500 });

  const eligible = (files ?? []).filter((file) => items?.some((item) =>
    item.product_id === file.product_id && (!file.variant_id || item.variant_id === file.variant_id)));
  if (eligible.length === 0) return NextResponse.json({ error: "No downloads are attached to this purchase." }, { status: 404 });

  const downloads = [];
  for (const file of eligible) {
    const { data, error } = await supabase.storage.from(file.storage_bucket).createSignedUrl(file.storage_path, 60);
    if (error || !data?.signedUrl) {
      console.error("Secure download link creation failed", { orderId: order.id, productId: file.product_id, error });
      return NextResponse.json({ error: "Could not create a secure download link." }, { status: 500 });
    }
    downloads.push({ fileName: file.file_name, url: data.signedUrl });
  }

  return NextResponse.json({ downloads, expiresInSeconds: 60 }, { headers: { "Cache-Control": "private, no-store" } });
}

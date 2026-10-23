import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Context = { params: Promise<{ id: string; fileId: string }> };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to download this file." }, { status: 401 });
    const { id, fileId } = await params;
    if (!uuidPattern.test(id) || !uuidPattern.test(fileId)) return NextResponse.json({ error: "Order and file ids must be UUIDs." }, { status: 400 });
    const supabase = getSupabaseServerClient();
    if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

    const { data: file, error } = await supabase.from("freelancer_order_files")
      .select("id,order_id,path")
      .eq("id", fileId)
      .eq("order_id", id)
      .maybeSingle();
    if (error) {
      const forbidden = /permission|not authorized|not a participant|forbidden|row-level security/i.test(error.message);
      return NextResponse.json({ error: forbidden ? "You are not permitted to access this file." : "File could not be loaded." }, { status: forbidden ? 403 : 400 });
    }
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

    const { data: signed, error: signedError } = await supabase.storage.from("order-files").createSignedUrl(file.path, 120);
    if (signedError) {
      const forbidden = /permission|not authorized|forbidden|row-level security/i.test(signedError.message);
      return NextResponse.json({ error: forbidden ? "You are not permitted to download this file." : "File could not be prepared for download." }, { status: forbidden ? 403 : 400 });
    }
    if (!signed?.signedUrl) return NextResponse.json({ error: "File could not be prepared for download." }, { status: 500 });
    return NextResponse.json({ url: signed.signedUrl });
  } catch (error) {
    console.error("freelance order file download failed", error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: "File could not be downloaded." }, { status: 500 });
  }
}

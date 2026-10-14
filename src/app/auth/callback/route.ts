import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Email links (confirm sign-up, reset password) land here. We swap the one-time code for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));
  const supabase = getSupabaseServerClient();
  if (supabase && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}

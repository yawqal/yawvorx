import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./config";

const PROTECTED = ["/account", "/admin"];

/** Refreshes the sign-in session on each request and sends signed-out visitors away from protected pages. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() asks Supabase to verify the session. (getSession() alone can be spoofed, so it is not used for protection.)
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const needsLogin = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));

  if (needsLogin && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return redirect;
  }
  return response;
}

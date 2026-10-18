import { NextResponse } from "next/server";

type Entry = { count: number; resetAt: number };
const requests = new Map<string, Entry>();

export function rateLimit(
  request: Request,
  namespace: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
  const key = `${namespace}:${ip}`;
  const now = Date.now();
  const current = requests.get(key);

  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + windowMs });
  } else if (current.count >= limit) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((current.resetAt - now) / 1000)) } },
    );
  } else {
    current.count += 1;
  }

  if (requests.size > 5000) {
    for (const [entryKey, entry] of requests) {
      if (entry.resetAt <= now) requests.delete(entryKey);
    }
  }
  return null;
}

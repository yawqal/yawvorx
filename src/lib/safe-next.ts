/** Only allow redirects to pages on this site (stops "open redirect" tricks like //evil.com). */
export function safeNext(value?: string | null, fallback = "/account"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}

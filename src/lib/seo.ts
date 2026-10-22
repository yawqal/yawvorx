import { siteConfig } from "@/config/site";

export function canonicalUrl(path: string): string {
  return new URL(path, process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).toString();
}

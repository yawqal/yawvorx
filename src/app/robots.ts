import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/vendor", "/api", "/checkout", "/cart", "/track", "/login", "/register"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}

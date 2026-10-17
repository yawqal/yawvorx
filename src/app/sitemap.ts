import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

const publicPaths = [
  "/",
  "/about",
  "/services",
  "/portfolio",
  "/shop",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping-policy",
  "/digital-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;

  return publicPaths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly",
  }));
}

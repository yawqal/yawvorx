import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const publicPaths = [
  "/",
  "/about",
  "/services",
  "/portfolio",
  "/shop",
  "/faq",
  "/contact",
  "/hire",
  "/privacy",
  "/terms",
  "/returns",
  "/shipping-policy",
  "/digital-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const supabase = getSupabaseServerClient();
  let productSlugs: string[] = [];
  if (supabase) {
    const products = await supabase.from("products").select("slug")
      .eq("is_published", true).eq("approval_status", "approved");
    if (products.error) console.error("Could not load products for sitemap:", products.error.message);
    else productSlugs = (products.data ?? []).map((product) => product.slug);
  }
  const paths = [
    ...publicPaths,
    ...productSlugs.map((slug) => `/shop/${encodeURIComponent(slug)}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly",
  }));
}

import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { projects as fallbackProjects } from "@/data/portfolio";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const supabase = getSupabaseServerClient();
  let productSlugs: string[] = [];
  let portfolioSlugs = fallbackProjects.map((project) => project.slug);
  if (supabase) {
    const [products, portfolio] = await Promise.all([
      supabase.from("products").select("slug").eq("is_published", true),
      supabase.from("portfolio_projects").select("slug").eq("is_published", true),
    ]);
    if (products.error) console.error("Could not load products for sitemap:", products.error.message);
    else productSlugs = (products.data ?? []).map((product) => product.slug);
    if (portfolio.error) console.error("Could not load portfolio for sitemap:", portfolio.error.message);
    else if (portfolio.data?.length) portfolioSlugs = portfolio.data.map((project) => project.slug);
  }
  const paths = [
    ...publicPaths,
    ...productSlugs.map((slug) => `/shop/${encodeURIComponent(slug)}`),
    ...portfolioSlugs.map((slug) => `/portfolio/${encodeURIComponent(slug)}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly",
  }));
}

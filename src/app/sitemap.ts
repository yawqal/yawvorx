import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  "/freelancers",
  "/courses",
  "/directory",
  "/vendors",
  "/affiliate",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url;
  const supabase = getSupabaseServerClient();
  let productSlugs: string[] = [];
  let freelancerSlugs: string[] = [];
  let courseSlugs: string[] = [];
  let directorySlugs: string[] = [];
  let vendorIds: string[] = [];
  if (supabase) {
    const [products, freelancers, courses, businesses, vendors] = await Promise.all([
      supabase.from("products").select("slug").eq("is_published", true).eq("approval_status", "approved"),
      supabase.from("freelancer_profiles").select("slug").eq("status", "approved"),
      supabase.from("courses").select("slug").eq("is_published", true),
      supabase.from("directory_businesses").select("slug").eq("status", "approved"),
      supabase.from("public_vendor_stores").select("id"),
    ]);
    if (products.error) console.error("Could not load products for sitemap:", products.error.message);
    else productSlugs = (products.data ?? []).map((item) => item.slug);
    if (freelancers.error) console.error("Could not load freelancers for sitemap:", freelancers.error.message);
    else freelancerSlugs = (freelancers.data ?? []).map((item) => item.slug);
    if (courses.error) console.error("Could not load courses for sitemap:", courses.error.message);
    else courseSlugs = (courses.data ?? []).map((item) => item.slug);
    if (businesses.error) console.error("Could not load directory entries for sitemap:", businesses.error.message);
    else directorySlugs = (businesses.data ?? []).map((item) => item.slug);
    if (vendors.error) console.error("Could not load vendors for sitemap:", vendors.error.message);
    else vendorIds = (vendors.data ?? []).map((item) => item.id);
  }
  const paths = [
    ...publicPaths,
    ...productSlugs.map((slug) => `/shop/${encodeURIComponent(slug)}`),
    ...freelancerSlugs.map((slug) => `/freelancers/${encodeURIComponent(slug)}`),
    ...courseSlugs.map((slug) => `/courses/${encodeURIComponent(slug)}`),
    ...directorySlugs.map((slug) => `/directory/${encodeURIComponent(slug)}`),
    ...vendorIds.map((id) => `/vendors/${encodeURIComponent(id)}`),
  ];
  return paths.map((path) => ({
    url: new URL(path, siteUrl).toString(),
    changeFrequency: "monthly",
  }));
}

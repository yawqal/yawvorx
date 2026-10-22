import { projects as staticProjects, type Project } from "@/data/portfolio";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type PortfolioRow = {
  slug: string; title: string; category: string | null; tags: string[] | null; summary: string;
  brief: string; approach: string; deliverables: string[] | null; live_url: string | null; is_demo: boolean; cover_image_path: string | null;
};

function mapProject(row: PortfolioRow, imageUrl?: string): Project {
  return {
    slug: row.slug, title: row.title, category: row.category || "General",
    tags: row.tags ?? [], summary: row.summary, brief: row.brief, approach: row.approach,
    deliverables: row.deliverables ?? [], liveUrl: row.live_url ?? undefined, isDemo: row.is_demo,
    ...(imageUrl ? { coverImageUrl: imageUrl } : {}),
  };
}

export async function getPublicProjects(): Promise<{ items: Project[]; usingFallback: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { items: staticProjects, usingFallback: true };
  const { data, error } = await supabase.from("portfolio_projects")
    .select("slug,title,category,tags,summary,brief,approach,deliverables,live_url,is_demo,cover_image_path")
    .eq("is_published", true).order("created_at", { ascending: false });
  if (error) {
    console.error("Could not load published portfolio projects from Supabase:", error.message);
    return { items: staticProjects, usingFallback: true };
  }
  if (!data?.length) return { items: staticProjects, usingFallback: true };
  return { items: data.map((item) => {
    const row = item as PortfolioRow;
    const imageUrl = row.cover_image_path
      ? supabase.storage.from("portfolio-images").getPublicUrl(row.cover_image_path).data.publicUrl
      : undefined;
    return mapProject(row, imageUrl);
  }), usingFallback: false };
}

export async function getPublicProject(slug: string): Promise<{ project?: Project; usingFallback: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { project: staticProjects.find((item) => item.slug === slug), usingFallback: true };
  const { data, error } = await supabase.from("portfolio_projects")
    .select("slug,title,category,tags,summary,brief,approach,deliverables,live_url,is_demo,cover_image_path")
    .eq("is_published", true).eq("slug", slug).maybeSingle();
  if (error) {
    console.error("Could not load portfolio project from Supabase:", error.message);
    return { project: staticProjects.find((item) => item.slug === slug), usingFallback: true };
  }
  if (data) {
    const row = data as PortfolioRow;
    const imageUrl = row.cover_image_path
      ? supabase.storage.from("portfolio-images").getPublicUrl(row.cover_image_path).data.publicUrl
      : undefined;
    return { project: mapProject(row, imageUrl), usingFallback: false };
  }
  return { project: staticProjects.find((item) => item.slug === slug), usingFallback: true };
}

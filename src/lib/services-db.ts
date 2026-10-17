import { services as staticServices, type Service } from "@/data/services";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getPublicServices(): Promise<{ items: Service[]; usingFallback: boolean }> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { items: staticServices, usingFallback: true };
  const { data, error } = await supabase.from("services")
    .select("slug,title,description,deliverables").eq("is_published", true).order("created_at");
  if (error) {
    console.error("Could not load published services from Supabase:", error.message);
    return { items: staticServices, usingFallback: true };
  }
  if (!data?.length) return { items: staticServices, usingFallback: true };
  return { items: data, usingFallback: false };
}

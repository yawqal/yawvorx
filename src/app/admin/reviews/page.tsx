import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ReviewsModeration } from "@/components/admin/ReviewsModeration";

export const metadata: Metadata = { title: "Product reviews", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Product reviews" /><Container className="py-10"><p role="alert">Database is not configured.</p></Container></>;
  }
  const { data, error } = await supabase.from("product_reviews")
    .select("id,product_id,rating,body,is_hidden,created_at,products(name,slug)")
    .order("created_at", { ascending: false }).limit(100);

  return (
    <>
      <PageHeader title="Product review moderation" intro="Hide or restore customer reviews. Review eligibility is enforced by Supabase RLS." />
      <Container className="py-10">
        {error
          ? <p role="alert" className="text-red-300">Reviews are unavailable. Review and apply the product reviews SQL proposal before moderation.</p>
          : <ReviewsModeration reviews={data ?? []} />}
      </Container>
    </>
  );
}

import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import DirectoryClient from "@/components/admin/DirectoryClient";

export const metadata: Metadata = { title: "Directory | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminDirectoryPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Directory" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  return (
    <>
      <PageHeader title="Directory" intro="Manage business listings." />
      <Container className="py-10">
        <DirectoryClient />
      </Container>
    </>
  );
}
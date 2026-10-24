import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import CoursesClient from "@/components/admin/CoursesClient";

export const metadata: Metadata = { title: "Courses | Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  await requireAdmin();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return <><PageHeader title="Courses" /><Container className="py-10"><p role="alert" className="text-red-300">Database is not configured.</p></Container></>;
  }

  return (
    <>
      <PageHeader title="Courses" intro="Manage courses offered on the platform." />
      <Container className="py-10">
        <CoursesClient />
      </Container>
    </>
  );
}
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { canonicalUrl } from "@/lib/seo";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { DirectorySubmitForm } from "@/components/marketplace/DirectorySubmitForm";
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Add a business", robots: { index: false, follow: false }, alternates: { canonical: canonicalUrl("/directory/add") } };
export default async function AddDirectoryBusinessPage() {
  await requireUser("/directory/add");
  return <><PageHeader title="Add your business" intro="Submit your business for directory review." /><Container className="max-w-3xl py-8 sm:py-10"><DirectorySubmitForm /></Container></>;
}

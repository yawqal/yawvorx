import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { HireForm } from "@/components/forms/HireForm";
import { getPublicServices } from "@/lib/services-db";

export const metadata: Metadata = { title: "Hire YAWVOREX", description: "Tell us about your project and how to reach you." };

export const dynamic = "force-dynamic";

export default async function Hire({ searchParams }: { searchParams: { service?: string } }) {
  const { items } = await getPublicServices();
  const requested = items.some((s) => s.slug === searchParams.service) ? searchParams.service : "";
  return (
    <>
      <PageHeader title="Hire YAWVOREX" intro="Describe your project and choose how you want to be contacted." />
      <Container className="max-w-2xl py-10"><HireForm defaultService={requested} availableServices={items} /></Container>
    </>
  );
}

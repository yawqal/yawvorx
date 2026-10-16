import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { HireForm } from "@/components/forms/HireForm";
import { services } from "@/data/services";

export const metadata: Metadata = { title: "Hire Zika Go", description: "Tell us about your project and how to reach you." };

export default function Hire({ searchParams }: { searchParams: { service?: string } }) {
  const requested = services.some((s) => s.slug === searchParams.service) ? searchParams.service : "";
  return (
    <>
      <PageHeader title="Hire Zika Go" intro="Describe your project and choose how you want to be contacted." />
      <Container className="max-w-2xl py-10"><HireForm defaultService={requested} /></Container>
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ResetForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function Reset() {
  return (
    <>
      <PageHeader title="Choose a new password" />
      <Container className="max-w-md py-10"><ResetForm /></Container>
    </>
  );
}

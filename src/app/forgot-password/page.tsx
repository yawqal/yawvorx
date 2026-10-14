import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { ForgotForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function Forgot() {
  return (
    <>
      <PageHeader title="Reset your password" intro="Enter your email and we will send you a reset link." />
      <Container className="max-w-md py-10"><ForgotForm /></Container>
    </>
  );
}

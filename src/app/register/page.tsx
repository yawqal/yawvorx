import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default function Register() {
  return (
    <>
      <PageHeader title="Create your account" intro="Track your orders and save your details." />
      <Container className="max-w-md py-10"><RegisterForm /></Container>
    </>
  );
}

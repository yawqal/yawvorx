import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { LoginForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function Login({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <>
      <PageHeader title="Sign in" intro="Access your account and orders." />
      <Container className="max-w-md py-10"><LoginForm next={safeNext(searchParams.next)} linkError={searchParams.error === "link"} /></Container>
    </>
  );
}

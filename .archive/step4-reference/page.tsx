import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { TrackForm } from "@/components/shop/TrackForm";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

export default function TrackPage({ searchParams }: { searchParams: { ref?: string } }) {
  const initialRef = typeof searchParams.ref === "string" ? searchParams.ref.slice(0, 30) : "";
  return (
    <>
      <PageHeader title="Track your order" intro="Enter your order reference and the tracking code you received when you placed the order." />
      <Container className="py-10"><TrackForm initialRef={initialRef} /></Container>
    </>
  );
}

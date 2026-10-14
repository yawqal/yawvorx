import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/components/forms/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function Checkout() {
  return (<><PageHeader title="Checkout" intro="Enter your details to prepare an order request." /><Container className="py-10"><CheckoutForm /></Container></>);
}

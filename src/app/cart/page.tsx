import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container } from "@/components/ui/Container";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Cart", robots: { index: false } };

export default function Cart() {
  return (<><PageHeader title="Your cart" /><Container className="py-10"><CartView /></Container></>);
}

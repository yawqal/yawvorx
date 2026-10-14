import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { products } from "@/data/products";

export const metadata: Metadata = { title: "Shop", description: "Digital and physical products from YAWVOREX." };

export default function Shop() {
  return (
    <>
      <PageHeader title="Shop" intro="Digital and physical products. Orders are confirmed by YAWVOREX before processing."><Badge tone="demo">Demo catalog</Badge></PageHeader>
      <Section title="Products"><ShopBrowser products={products} /></Section>
    </>
  );
}

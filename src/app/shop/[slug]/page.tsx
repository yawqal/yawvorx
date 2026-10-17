import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Art } from "@/components/ui/Art";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/cards/Cards";
import { AddToCart } from "@/components/shop/AddToCart";
import { availability } from "@/data/products";
import { getProductBySlug, getProducts } from "@/lib/products-db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProductBySlug(params.slug);
  return p ? {
    title: p.name,
    description: p.description,
    openGraph: { title: p.name, description: p.description, type: "website" },
  } : { title: "Product not found", description: "This product could not be found." };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProductBySlug(params.slug);
  if (!p) notFound();
  const products = await getProducts();
  const a = availability(p);
  const related = products.filter((x) => x.slug !== p.slug && x.category === p.category).concat(products.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    category: p.category,
    offers: {
      "@type": "Offer",
      price: p.price.toFixed(2),
      priceCurrency: p.currency,
      availability: p.type === "digital" || (p.stock ?? 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: new URL(`/shop/${encodeURIComponent(p.slug)}`, process.env.NEXT_PUBLIC_SITE_URL ?? "https://yawvorx-xzyn-yawvorx.vercel.app").toString(),
    },
  };

  return (
    <Container className="py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/shop" className="inline-block py-2 text-ink-mute hover:text-ink">Back to shop</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <Art seed={p.name.length} />
        <div>
          <div className="flex flex-wrap gap-2">{p.isDemo && <Badge tone="demo">Demo product</Badge>}<Badge>{p.type === "digital" ? "Digital" : "Physical"}</Badge><Badge tone={a.ok ? "ok" : "warn"}>{a.label}</Badge></div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{p.name}</h1>
          <p className="mt-1 text-ink-mute">{p.category}</p>
          <p className="mt-4 text-ink-mute">{p.description}</p>
          <div className="mt-6"><AddToCart product={p} /></div>
          <Card className="mt-6 text-sm text-ink-mute">
            <h2 className="font-semibold text-ink">{p.type === "digital" ? "Digital delivery" : "Shipping"}</h2>
            <p className="mt-1">{p.type === "digital"
              ? "After your payment is verified by YAWVOREX, secure download links are available in your account."
              : "Delivery details and any shipping cost are confirmed when your order is reviewed."}</p>
            <p className="mt-2">Ordering: add to cart, check out, and send your order request. Orders are confirmed manually.</p>
          </Card>
        </div>
      </div>
      {related.length > 0 && (
        <section className="mt-14"><h2 className="text-2xl font-semibold">Related products</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ProductCard key={r.slug} p={r} />)}</div></section>
      )}
    </Container>
  );
}

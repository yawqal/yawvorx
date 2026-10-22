import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { ProductImage } from "@/components/ui/ProductImage";
import { Card } from "@/components/ui/Card";
import { ProductCard } from "@/components/cards/Cards";
import { AddToCart } from "@/components/shop/AddToCart";
import { availability } from "@/data/products";
import { getProductBySlug, getProducts } from "@/lib/products-db";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProductReviews } from "@/components/shop/ProductReviews";
import { ProductPrice } from "@/components/shop/ProductPrice";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return p ? {
    title: p.name,
    description: p.description,
    openGraph: { title: p.name, description: p.description, type: "website" },
  } : { title: "Product not found", description: "This product could not be found." };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const [products, user] = await Promise.all([getProducts(), getCurrentUser()]);
  const supabase = getSupabaseServerClient();
  const reviewsResult = p.id && supabase
    ? await supabase.from("product_reviews").select("id,rating,body,created_at")
      .eq("product_id", p.id).order("created_at", { ascending: false }).limit(50)
    : { data: [], error: null };
  if (reviewsResult.error) console.error("Could not load product reviews:", reviewsResult.error.message);
  const reviewRows = reviewsResult.data ?? [];
  const visibleReviews = reviewRows;
  const averageRating = visibleReviews.length
    ? visibleReviews.reduce((sum, review) => sum + review.rating, 0) / visibleReviews.length
    : null;
  const a = availability(p);
  const related = products.filter((x) => x.slug !== p.slug && x.category === p.category).concat(products.filter((x) => x.slug !== p.slug && x.category !== p.category)).slice(0, 3);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    category: p.category,
    offers: (() => {
      const shared = {
        "@type": "Offer",
        availability: p.type === "digital" || (p.stock ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        url: new URL(`/shop/${encodeURIComponent(p.slug)}`, process.env.NEXT_PUBLIC_SITE_URL ?? "https://yawvorx-xzyn-yawvorx.vercel.app").toString(),
      };
      return typeof p.priceETB === "number" && typeof p.priceUSD === "number"
        ? [
          { ...shared, price: p.priceETB.toFixed(2), priceCurrency: "ETB" },
          { ...shared, price: p.priceUSD.toFixed(2), priceCurrency: "USD" },
        ]
        : { ...shared, price: p.price.toFixed(2), priceCurrency: p.currency };
    })(),
  };

  return (
    <Container className="py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/shop" className="inline-block py-2 text-ink-mute hover:text-ink">Back to shop</Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-2">
        <ProductImage src={p.image_url} alt={p.name} />
        <div>
          <div className="flex flex-wrap gap-2">{p.isDemo && <Badge tone="demo">Demo product</Badge>}<Badge>{p.type === "digital" ? "Digital" : "Physical"}</Badge><Badge tone={a.ok ? "ok" : "warn"}>{a.label}</Badge></div>
          <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">{p.name}</h1>
          <p className="mt-1 text-ink-mute">{p.category}</p>
          <p className="mt-4 text-ink-mute">{p.description}</p>
          <p className="mt-5"><ProductPrice product={p} className="font-display text-lg" /></p>
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
      {reviewsResult.error
        ? <section className="mt-14 border-t border-line pt-8"><h2 className="text-2xl font-semibold">Customer reviews</h2><p className="mt-2 text-sm text-ink-mute">Reviews are not available until the owner applies the product reviews SQL proposal.</p></section>
        : p.id && <ProductReviews
          productId={p.id}
          productSlug={p.slug}
          reviews={visibleReviews}
          average={averageRating}
          signedIn={!!user}
        />}
    </Container>
  );
}

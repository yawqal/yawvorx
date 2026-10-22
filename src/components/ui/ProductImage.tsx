import { Art } from "@/components/ui/Art";

export function ProductImage({ src, alt, className = "" }: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (typeof src === "string" && src.length > 0 && src.startsWith("https://")) {
    return (
      <div className={`relative aspect-[16/10] overflow-hidden rounded-xl border border-line ${className}`}>
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
    );
  }
  return <Art seed={alt.length} className={className} />;
}

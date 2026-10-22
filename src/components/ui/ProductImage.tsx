import { Art } from "@/components/ui/Art";
import Image from "next/image";

export function ProductImage({ src, alt, className = "" }: {
  src: string | null | undefined;
  alt: string;
  className?: string;
}) {
  if (typeof src === "string" && src.length > 0 && src.startsWith("https://")) {
    return (
      <div className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-obsidian-800 ${className}`}>
        <Image src={src} alt={alt} fill sizes="(max-width: 1024px) 100vw, 50vw" unoptimized
          className="object-cover transition-transform duration-500 group-hover:scale-105" />
      </div>
    );
  }
  return <Art seed={alt.length} className={className} />;
}

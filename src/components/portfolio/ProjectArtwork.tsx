import Image from "next/image";
import { Art } from "@/components/ui/Art";

export function ProjectArtwork({ imageUrl, title, seed = 0, className = "" }: {
  imageUrl?: string; title: string; seed?: number; className?: string;
}) {
  if (!imageUrl) return <Art seed={seed} className={className} />;
  return (
    <div className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-obsidian-800 ${className}`}>
      <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw" unoptimized
        className="object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
    </div>
  );
}

"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [selected, setSelected] = useState(0);
  const active = images[selected] ?? images[0] ?? null;

  return (
    <div>
      <div className="overflow-hidden rounded-[1.75rem] border border-line bg-obsidian-900 p-2 sm:p-3">
        <ProductImage src={active} alt={name} className="!aspect-[4/3] rounded-[1.25rem] border-0" />
      </div>
      {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`Show ${name} image ${index + 1}`}
          aria-pressed={selected === index} onClick={() => setSelected(index)}
          className={`relative aspect-square overflow-hidden rounded-xl border bg-obsidian-800 transition ${selected === index ? "border-brand ring-2 ring-brand/30" : "border-line hover:border-brand/50"}`}>
          <Image src={image} alt="" fill sizes="96px" unoptimized className="object-cover" />
        </button>)}
      </div>}
      <p className="mt-3 text-xs uppercase tracking-[0.16em] text-ink-mute">Product view · {name}</p>
    </div>
  );
}

"use client";

import NextImage from "next/image";
import { useEffect, useState } from "react";

interface PageBackgroundProps {
  src?: string;
  priority?: boolean;
}

export function PageBackground({ src, priority = false }: PageBackgroundProps) {
  const [imageExists, setImageExists] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!src) {
      setImageExists(false);
      return;
    }

    const img = new Image();
    img.onload = () => setImageExists(true);
    img.onerror = () => setImageExists(false);
    img.src = src;
  }, [src]);

  if (!src || !imageExists || isMobile) {
    return null;
  }

  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      <div className="absolute inset-0 bg-[var(--color-bg)] opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg)/90]" />
      <NextImage
        src={src}
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        loading={priority ? "eager" : "lazy"}
        quality={75}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
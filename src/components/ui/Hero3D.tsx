'use client';

import { useEffect, useState, useRef } from 'react';

export function Hero3D({
  className = '',
  layers = 3,
  intensity = 20,
  perspective = 800,
}: {
  className?: string;
  layers?: number;
  intensity?: number; // max translation in pixels
  perspective?: number;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Check if user prefers reduced motion
  const useReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (useReducedMotion || typeof window === 'undefined') {
      setStyle({}); // Reset to no transform
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Request animation frame for smooth updates
      animationFrameRef.current = requestAnimationFrame(() => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate normalized offset from center (-0.5 to 0.5)
        const offsetX = (e.clientX - centerX) / rect.width;
        const offsetY = (e.clientY - centerY) / rect.height;

        // Apply subtle translation and rotation based on offset
        const translateX = offsetX * intensity;
        const translateY = offsetY * intensity;
        const rotateY = offsetX * (intensity / 20); // less rotation
        const rotateX = -offsetY * (intensity / 20);

        setStyle({
          perspective: `${perspective}px`,
          transformStyle: 'preserve-3d',
          transform: `translateX(${translateX}px) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out',
        });
      });
    };

    const handleMouseLeave = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        setStyle({
          perspective: `${perspective}px`,
          transformStyle: 'preserve-3d',
          transform: 'translateX(0px) translateY(0px) rotateX(0deg) rotateY(0deg)',
          transition: 'transform 0.2s ease-out',
        });
      });
    };

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, perspective, useReducedMotion, layers]);

  // Generate layers
  const layersElements = [];
  for (let i = 0; i < layers; i++) {
    const depth = (i / Math.max(layers - 1, 1)) * 0.6 + 0.2; // 0.2 to 0.8
    const blur = Math.round(depth * 80);
    const opacity = 0.15 + depth * 0.25;
    const hue = 220 + Math.round(depth * 30); // cyan to violet shift
    const size = 80 + Math.round(depth * 40); // size variation
    const delay = i * 200; // stagger appearance

    layersElements.push(
      <div
        key={i}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `hsla(${hue}, 70%, 60%, ${opacity})`,
          filter: `blur(${blur}px)`,
          transform: `translateZ(${depth * 200}px) scale(${1 + depth * 0.5})`,
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden pointer-events-none ${className}`}
      style={{
        ...style,
        width: '100%',
        height: '100%',
      }}
    >
      {layersElements}
    </div>
  );
}
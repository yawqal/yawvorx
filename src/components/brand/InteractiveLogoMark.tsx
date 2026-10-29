'use client';

import { useEffect, useState, useRef } from 'react';
import { LogoMark } from './Logo';

export function InteractiveLogoMark({
  size = 32,
  className = '',
  tiltAmount = 5,
  perspective = 1000
}: {
  size?: number;
  className?: string;
  tiltAmount?: number;
  perspective?: number
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

        // Calculate rotation amounts (in degrees)
        const rotateY = offsetX * tiltAmount; // Horizontal mouse movement -> Y axis rotation
        const rotateX = -offsetY * tiltAmount; // Vertical mouse movement -> X axis rotation (inverted for natural feel)

        setStyle({
          perspective: `${perspective}px`,
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transition: 'transform 0.1s ease-out', // Smooth transition
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
          transform: 'rotateX(0deg) rotateY(0deg)',
          transition: 'transform 0.2s ease-out', // Smooth return to center
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
  }, [size, tiltAmount, perspective, useReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={`inline-block ${className}`}
      style={{
        ...style,
        // Ensure the element has a 3D space
        transformStyle: 'preserve-3d',
      }}
    >
      <LogoMark size={size} />
    </div>
  );
}
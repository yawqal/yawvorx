import { siteConfig } from "@/config/site";

type Props = { size?: number; wordmark?: boolean; animated?: boolean; className?: string };

/** Zika Go mark: a neon Z with cyan and violet beams. Pure SVG, no image file. */
export function LogoMark({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={animated ? "logo-draw" : undefined}>
      <defs>
        <linearGradient id="zika-cyan" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#06B6D4" /><stop offset="1" stopColor="#67E8F9" />
        </linearGradient>
        <linearGradient id="zika-violet" x1="40" y1="8" x2="8" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <filter id="zika-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path pathLength={1} d="M10 10 H38" stroke="url(#zika-cyan)" strokeWidth="5" strokeLinecap="round" filter="url(#zika-glow)" />
      <path pathLength={1} d="M37 11 L11 37" stroke="url(#zika-violet)" strokeWidth="5" strokeLinecap="round" filter="url(#zika-glow)" />
      <path pathLength={1} d="M10 38 H38" stroke="url(#zika-cyan)" strokeWidth="5" strokeLinecap="round" filter="url(#zika-glow)" />
    </svg>
  );
}

export function Logo({ size = 32, wordmark = true, animated = false, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} animated={animated} />
      {wordmark && (
        <span className="text-gradient font-display font-semibold tracking-[0.08em]" style={{ fontSize: size * 0.55 }}>
          {siteConfig.name}
        </span>
      )}
    </span>
  );
}

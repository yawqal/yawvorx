import { siteConfig } from "@/config/site";

type Props = { size?: number; wordmark?: boolean; animated?: boolean; className?: string };

/** YAWVOREX mark: a "Y" built from two beams (cyan + violet) meeting in one stem. Pure SVG, no image file. */
export function LogoMark({ size = 32, animated = false }: { size?: number; animated?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true" className={animated ? "logo-draw" : undefined}>
      <defs>
        <linearGradient id="yvx-a" x1="8" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" /><stop offset="1" stopColor="#67E8F9" />
        </linearGradient>
        <linearGradient id="yvx-b" x1="40" y1="8" x2="24" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8B5CF6" /><stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <path pathLength={1} d="M8 8 L24 28" stroke="url(#yvx-a)" strokeWidth="5" strokeLinecap="round" />
      <path pathLength={1} d="M40 8 L24 28" stroke="url(#yvx-b)" strokeWidth="5" strokeLinecap="round" />
      <path pathLength={1} d="M24 28 V41" stroke="#F4F6FA" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ size = 32, wordmark = true, animated = false, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} animated={animated} />
      {wordmark && (
        <span className="font-display font-semibold tracking-[0.26em] text-ink" style={{ fontSize: size * 0.55 }}>
          {siteConfig.name}
        </span>
      )}
    </span>
  );
}

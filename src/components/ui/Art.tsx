// Abstract on-brand visual used until real images are uploaded. Decorative, so hidden from screen readers.
const angles = [135, 200, 60, 280, 20, 160];

export function Art({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  const a = angles[seed % angles.length];
  return (
    <div aria-hidden="true" className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-line ${className}`}
      style={{ background: `linear-gradient(${a}deg, rgba(34,211,238,0.28), rgba(7,8,11,0.9) 55%, rgba(139,92,246,0.35))` }}>
      <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 160 100" preserveAspectRatio="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={i * 24 - 20 + seed * 7} y1="0" x2={i * 24 + 40 + seed * 7} y2="100" stroke="#F4F6FA" strokeWidth="0.4" />
        ))}
      </svg>
    </div>
  );
}

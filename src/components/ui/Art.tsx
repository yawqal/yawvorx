// Branded artwork placeholder used when no real project or product image is available.
const angles = [135, 200, 60, 280, 20, 160];

export function Art({ seed = 0, className = "" }: { seed?: number; className?: string }) {
  const a = angles[seed % angles.length];
  return (
    <div aria-hidden="true" className={`relative aspect-[4/3] overflow-hidden rounded-xl border border-line ${className}`}
      style={{ background: `radial-gradient(65% 70% at 70% 26%, rgba(118,87,232,.2), transparent 78%), linear-gradient(${a}deg, rgba(84,201,221,.16), rgba(255,255,255,.96) 56%, rgba(118,87,232,.18))` }}>
      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 160 100" preserveAspectRatio="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={i * 24 - 20 + seed * 7} y1="0" x2={i * 24 + 40 + seed * 7} y2="100" stroke="#7657E8" strokeWidth="0.4" />
        ))}
      </svg>
      <div className="absolute inset-x-[18%] inset-y-[16%] rounded-[1.25rem] border border-white/90 bg-white/40 shadow-[0_20px_45px_-30px_rgba(64,53,125,.45)] backdrop-blur-sm" />
      <div className="absolute left-[27%] top-[30%] h-[38%] w-[46%] rounded-[1rem] border border-white/80 bg-gradient-to-br from-white/85 via-violet/10 to-cyan/20 shadow-[0_18px_35px_-28px_rgba(55,49,104,.5)]" />
    </div>
  );
}

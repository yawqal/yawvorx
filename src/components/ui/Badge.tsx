const tones = {
  demo: "border-brand/20 bg-brand/10 text-brand-soft",
  info: "border-brand/25 bg-brand/10 text-secondary-soft",
  ok: "border-emerald-700/15 bg-emerald-600/10 text-emerald-300",
  warn: "border-amber-700/15 bg-amber-500/10 text-amber-300",
} as const;

export function Badge({ tone = "info", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

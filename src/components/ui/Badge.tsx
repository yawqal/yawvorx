const tones = {
  demo: "border-violet/50 bg-violet/10 text-violet-soft",
  info: "border-cyan/40 bg-cyan/10 text-cyan-soft",
  ok: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-300",
} as const;

export function Badge({ tone = "info", children }: { tone?: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

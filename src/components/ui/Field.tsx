import { useId } from "react";

type Common = { label: string; error?: string; hint?: string };
const control =
  "w-full px-6 py-4 text-base placeholder:text-ink-mute/70 focus:border-violet focus:outline-none focus:ring-2 focus:ring-violet/50 transition-all duration-300 ease-out";

function Wrap({ label, error, hint, id, children }: Common & { id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-d`} className="text-sm text-ink-mute">{hint}</p>}
      {error && <p id={`${id}-d`} role="alert" className="text-sm text-red-300">{error}</p>}
    </div>
  );
}
const state = (error?: string) => (error ? "border-red-400/70" : "border-line");

export function Input({ label, error, hint, ...p }: Common & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Wrap {...{ label, error, hint, id }}>
      <input id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-d` : undefined} className={`control ${control} ${state(error)} hover:border-violet/30 hover:bg-white/50`} {...p} />
    </Wrap>
  );
}

export function Textarea({ label, error, hint, ...p }: Common & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Wrap {...{ label, error, hint, id }}>
      <textarea id={id} rows={5} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-d` : undefined} className={`control ${control} ${state(error)} hover:border-violet/30 hover:bg-white/50`} {...p} />
    </Wrap>
  );
}

export function Select({ label, error, hint, children, ...p }: Common & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Wrap {...{ label, error, hint, id }}>
      <select id={id} aria-invalid={!!error} aria-describedby={error || hint ? `${id}-d` : undefined} className={`control ${control} ${state(error)} hover:border-violet/30 hover:bg-white/50`} {...p}>{children}</select>
    </Wrap>
  );
}

// Enhanced field focus states can be added via className when needed

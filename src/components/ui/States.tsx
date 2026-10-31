"use client";
import { Button } from "./Button";

export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" role="status" aria-label="Loading">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" fill="none" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="flex items-center justify-center gap-3 py-16 text-ink-mute"><Spinner />{label}</div>;
}

type StateProps = { title: string; description?: string; action?: { label: string; href: string } };

/** Empty screens should tell the visitor (or owner) what to do next. */
export function EmptyState({ title, description, action }: StateProps) {
  return (
    <div className="surface mx-auto max-w-lg p-8 text-center" aria-label={title}>
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-ink-mute">{description}</p>}
      {action && <Button href={action.href} className="mt-5">{action.label}</Button>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="surface mx-auto max-w-lg border-red-400/40 p-8 text-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      {description && <p className="mt-2 text-ink-mute">{description}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry} className="mt-5">Try again</Button>}
    </div>
  );
}

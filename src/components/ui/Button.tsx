import Link from "next/link";
import { Spinner } from "./States";

type Variant = "primary" | "secondary" | "ghost";
type Props = {
  variant?: Variant;
  href?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const base =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition duration-300 ease-out active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet/50 disabled:pointer-events-none disabled:opacity-50 sm:text-base";
const variants: Record<Variant, string> = {
  primary: "bg-violet text-white shadow-[0_8px_20px_-12px_rgba(77,52,171,.75)] hover:bg-violet-soft motion-safe:hover:shadow-glow motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.015]",
  secondary: "border border-line bg-white text-ink shadow-sm motion-safe:hover:border-violet/40 motion-safe:hover:bg-violet/[0.04] motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.015]",
  ghost: "text-ink-mute motion-safe:hover:bg-violet/[0.06] motion-safe:hover:text-ink motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-[1.015]",
};

/** Pass `href` to render a link, otherwise it renders a <button>. */
export function Button({ variant = "primary", href, loading, className = "", children, ...rest }: Props) {
  const cls = `${base} ${variants[variant]} ${className}`;
  if (href) {
    const external = /^https?:\/\//.test(href);
    return external ? (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">{children}</a>
    ) : (
      <Link href={href} className={cls}>{children}</Link>
    );
  }
  return (
    <button className={cls} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

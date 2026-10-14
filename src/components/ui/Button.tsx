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
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition duration-200 disabled:pointer-events-none disabled:opacity-50 sm:text-base";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-to-r from-cyan to-violet text-obsidian hover:brightness-110 hover:shadow-glow",
  secondary: "border border-line bg-obsidian-800 text-ink hover:border-cyan/50",
  ghost: "text-ink-mute hover:text-ink",
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

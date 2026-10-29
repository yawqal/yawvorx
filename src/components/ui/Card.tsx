export function Card({ children, interactive = false, className = "" }: { children: React.ReactNode; interactive?: boolean; className?: string }) {
  return <div className={`surface p-6 sm:p-8 ${interactive ? "surface-hover motion-safe:hover:-translate-y-2 motion-safe:hover:scale-[1.03] motion-safe:hover:shadow-2xl transition-transform duration-300 ease-out" : ""} ${className}`}>{children}</div>;
}

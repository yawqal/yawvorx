export function Card({ children, interactive = false, className = "" }: { children: React.ReactNode; interactive?: boolean; className?: string }) {
  return <div className={`surface p-5 sm:p-6 ${interactive ? "surface-hover" : ""} ${className}`}>{children}</div>;
}

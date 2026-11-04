import { Container } from "./Container";

export function Section({ title, intro, children, className = "" }: { title?: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`py-16 sm:py-20 lg:py-24 ${className}`}>
      <Container>
        {(title || intro) && (
          <div className="mb-12 max-w-2xl">
            {title && <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h2>}
            {intro && <p className="mt-4 text-lg leading-relaxed text-ink-mute">{intro}</p>}
          </div>
        )}
        {children}
      </Container>
    </section>
  );
}

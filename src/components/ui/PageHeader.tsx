import { Container } from "./Container";

export function PageHeader({ title, intro, children }: { title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="bg-aurora border-b border-line">
      <Container className="py-12 sm:py-16">
        {children && <div className="mb-4 flex flex-wrap gap-2">{children}</div>}
        <h1 className="max-w-3xl text-3xl font-semibold sm:text-5xl">{title}</h1>
        {intro && <p className="mt-4 max-w-2xl text-lg text-ink-mute">{intro}</p>}
      </Container>
    </div>
  );
}

import { Container } from "./Container";

export function PageHeader({ title, intro, children }: { title: React.ReactNode; intro?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="bg-aurora relative isolate overflow-hidden border-b border-line">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-violet/10 sm:right-12 sm:top-[-10rem] sm:h-[26rem] sm:w-[26rem]" />
      <Container className="relative grid gap-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,.45fr)] lg:items-end lg:py-[5.5rem]">
        <div>
          {children && <div className="mb-6 flex flex-wrap gap-2">{children}</div>}
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] tracking-tighter sm:text-6xl lg:text-7xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-mute sm:text-lg">{intro}</p>}
        </div>
        <div aria-hidden="true" className="hidden h-px bg-gradient-to-r from-violet/30 to-cyan/20 lg:block" />
      </Container>
    </div>
  );
}

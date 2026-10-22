export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10 ${className}`}>{children}</div>;
}

export function Section({ title, intro, children, id }: { title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-14 sm:py-20 lg:py-24">
      <Container>
        <h2 className="text-2xl font-semibold sm:text-4xl">{title}</h2>
        {intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-mute sm:text-lg">{intro}</p>}
        <div className="mt-7 sm:mt-9">{children}</div>
      </Container>
    </section>
  );
}

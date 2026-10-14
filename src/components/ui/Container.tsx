export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Section({ title, intro, children, id }: { title: string; intro?: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-14 sm:py-20">
      <Container>
        <h2 className="text-2xl font-semibold sm:text-4xl">{title}</h2>
        {intro && <p className="mt-3 max-w-2xl text-ink-mute">{intro}</p>}
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}

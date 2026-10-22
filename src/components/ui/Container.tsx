export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 ${className}`}>{children}</div>;
}

export function Section({ title, intro, children, id }: { title: React.ReactNode; intro?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="max-w-3xl">
          <h2 className="section-heading">{title}</h2>
          {intro && <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-mute sm:text-lg">{intro}</p>}
        </div>
        <div className="mt-7 sm:mt-8">{children}</div>
      </Container>
    </section>
  );
}

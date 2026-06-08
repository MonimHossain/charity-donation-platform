import Link from "next/link";

const cards = [
  { title: "Zakat Guide", image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=70", href: "/zakat", desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat." },
  { title: "Zakat Appeal", image: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=70", href: "/donate?cause=zakat", desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat." },
  { title: "Zakat Calculator", image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=70", href: "/zakat", desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat." },
];

const ZakatResources = () => (
  <section className="relative py-20 bg-gradient-to-br from-accent/30 via-accent/15 to-accent/40">
    <div className="container-wide">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">Zakat Hub</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl text-primary">Everything you need for Zakat</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group rounded-3xl overflow-hidden bg-card shadow-soft hover:shadow-lift transition-all duration-500 flex flex-col"
          >
            <div className="aspect-square overflow-hidden bg-secondary">
              <img
                src={c.image}
                alt={c.title}
                width={768}
                height={768}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="p-6 lg:p-8 text-center flex-1 flex flex-col">
              <h3 className="font-serif text-2xl lg:text-3xl text-accent-deep font-bold">{c.title}</h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default ZakatResources;

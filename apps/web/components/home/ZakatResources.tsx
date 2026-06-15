import Link from "next/link";

const cards = [
  {
    title: "Zakat Guide",
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=800&q=70",
    href: "/zakat",
    desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat.",
  },
  {
    title: "Zakat Appeal",
    image:
      "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=70",
    href: "/donate?cause=zakat",
    desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat.",
  },
  {
    title: "Zakat Calculator",
    image:
      "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=70",
    href: "/zakat",
    desc: "Our guide covering all you need to know about Zakat, zakat calculator and donate with zakat.",
  },
];

const stats = [
  {
    badge: "£2.6 m",
    title: "Zakat distributed each year",
    desc: "Thanks to your generosity, annually we distribute life changing Zakat",
  },
  {
    badge: "2.5 %",
    title: "Distributing your wealth",
    desc: "All Muslims eligible to pay Zakat must donate at least 2.5% of their wealth.",
  },
  {
    badge: "54,504",
    title: "People distributed Zakat",
    desc: "Last year we distributed Zakat to over 54,000 people in the UK and Overseas.",
  },
];

const ZakatResources = () => (
  <section className="relative py-16 md:py-20 bg-gradient-to-br from-[hsl(72_72%_88%)] via-[hsl(74_68%_84%)] to-[hsl(76_64%_80%)]">
    <div className="container-wide">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft hover:shadow-lift transition-shadow duration-300"
          >
            <div className="aspect-[4/3] overflow-hidden bg-secondary">
              <img
                src={c.image}
                alt={c.title}
                width={640}
                height={480}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            </div>
            <div className="flex flex-1 flex-col px-5 py-6 text-center sm:px-6 sm:py-7">
              <h3 className="font-serif text-2xl font-bold text-accent-deep sm:text-[1.65rem]">
                {c.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">
                {c.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 lg:mt-5 rounded-2xl bg-[hsl(75_42%_22%)] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {stats.map((s) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <span className="inline-flex rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground tabular-nums">
                {s.badge}
              </span>
              <h4 className="mt-4 font-serif text-xl font-bold text-white sm:text-[1.35rem]">
                {s.title}
              </h4>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/85">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default ZakatResources;

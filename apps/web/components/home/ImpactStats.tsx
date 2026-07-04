import { statValueClass } from "@/lib/home-buttons";

const STATS = [
  {
    value: "£2.6m",
    title: "Zakat distributed each year",
    description: "Thanks to your generosity, life-changing Zakat is delivered annually.",
  },
  {
    value: "54,504",
    title: "People reached with Zakat",
    description: "Across the UK and overseas in the last year alone.",
  },
  {
    value: "100%",
    title: "Donation policy on Zakat",
    description: "Every penny of your Zakat reaches eligible recipients.",
  },
] as const;

const ImpactStats = () => (
  <section className="bg-primary text-primary-foreground">
    <div className="container-wide py-14 md:py-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
      {STATS.map((s) => (
        <div key={s.title} className="border-l-2 border-primary-foreground/30 pl-5 md:pl-6 min-w-0">
          <p className={`${statValueClass} text-accent`}>{s.value}</p>
          <h3 className="mt-2 text-lg md:text-xl font-bold leading-snug">{s.title}</h3>
          <p className="mt-2 text-sm text-primary-foreground/85 leading-relaxed">{s.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default ImpactStats;

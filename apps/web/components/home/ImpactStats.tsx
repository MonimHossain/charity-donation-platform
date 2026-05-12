const stats = [
  { value: "£2.6m", label: "Zakat distributed each year", note: "Thanks to your generosity, life-changing Zakat is delivered annually." },
  { value: "54,504", label: "People reached with Zakat", note: "Across the UK and overseas in the last year alone." },
  { value: "100%", label: "Donation policy on Zakat", note: "Every penny of your Zakat reaches eligible recipients." },
];

const ImpactStats = () => (
  <section className="bg-primary text-primary-foreground">
    <div className="container-wide py-20 grid lg:grid-cols-3 gap-8 lg:gap-12">
      {stats.map((s) => (
        <div key={s.label} className="border-l-2 border-accent pl-6">
          <p className="font-serif text-5xl md:text-6xl font-semibold text-plum leading-none">{s.value}</p>
          <h3 className="mt-4 text-xl font-medium">{s.label}</h3>
          <p className="mt-2 text-sm text-primary-foreground/70 leading-relaxed">{s.note}</p>
        </div>
      ))}
    </div>
  </section>
);

export default ImpactStats;

import { MapPin } from "lucide-react";
import PageShell, { PageHero } from "@/components/site/PageShell";
import CTA from "@/components/home/CTA";

const regions = [
  { name: "Gaza & Palestine", desc: "Emergency food parcels, hot meals, water and orphan sponsorship.", urgent: true },
  { name: "Yemen", desc: "Famine response, medical aid and clean water for displaced families." },
  { name: "Syria", desc: "Shelter, winter relief and ongoing support for refugees." },
  { name: "Sudan", desc: "Rapid food aid distribution amid escalating conflict." },
  { name: "Pakistan", desc: "Livelihood projects, water wells and orphan sponsorship." },
  { name: "East Africa", desc: "Drought response, water wells and sustainable agriculture." },
];

export default function WhereWeWorkPage() {
  return (
    <PageShell
      title="Where We Work — Your Impact Foundation"
      description="Delivering humanitarian aid across Palestine, Yemen, Syria, Africa and Asia."
    >
      <PageHero
        eyebrow="Where We Work"
        title={
          <>
            From Gaza to Sudan, <span className="underline-brush">your aid travels far</span>.
          </>
        }
        description="We work where need is greatest — combining rapid emergency response with long-term community programmes."
      />
      <section className="container-wide py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((r) => (
          <div
            key={r.name}
            className="rounded-3xl bg-card border border-border p-7 hover:shadow-lift transition-all"
          >
            <div className="w-12 h-12 rounded-2xl grid place-items-center bg-primary/10 text-primary">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="mt-5 font-serif text-2xl text-primary flex items-center gap-2">
              {r.name}
              {r.urgent && (
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                  Urgent
                </span>
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </section>
      <CTA />
    </PageShell>
  );
}

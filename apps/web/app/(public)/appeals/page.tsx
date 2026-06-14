import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { demoCampaigns } from "@/lib/mock/campaigns";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import CTA from "@/components/home/CTA";
import Fundraisers from "@/components/home/Fundraisers";

export default function AppealsPage() {
  return (
    <PageShell
      title="Our Appeals — Your Impact Foundation"
      description="Support emergency, food, water, livelihood and orphan appeals around the world."
    >
      <PageHero
        eyebrow="Appeals"
        title={
          <>
            Where your generosity <span className="underline-brush">becomes action</span>.
          </>
        }
        description="Choose a cause close to your heart — every appeal is delivered with full transparency and a 100% donation promise on Zakat."
      />
      <Fundraisers />
      <section className="container-wide py-20 grid gap-8 md:grid-cols-2">
        {demoCampaigns.map((a) => (
          <article
            key={a.slug}
            className="group rounded-3xl overflow-hidden bg-card border border-border shadow-soft hover:shadow-lift transition-all"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={a.image}
                alt={a.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="p-8">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-secondary text-primary text-xs font-semibold uppercase tracking-wider">
                  {a.tag}
                </span>
                {a.urgent && (
                  <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold uppercase tracking-wider">
                    Urgent
                  </span>
                )}
              </div>
              <h2 className="mt-4 font-serif text-3xl text-primary">{a.title}</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">{a.summary}</p>
              <Button asChild className="mt-6 rounded-full bg-accent hover:bg-primary hover:text-primary-foreground" variant="default">
                <Link href={`/campaigns/${a.slug}`}>
                  Learn more & donate <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </section>
      <CTA />
    </PageShell>
  );
}

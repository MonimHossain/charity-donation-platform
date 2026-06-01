import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { demoCharities } from "@/lib/mock/charities";
import { Badge } from "@/components/ui/badge";

export default function MockCharitiesList() {
  return (
    <PageShell title="Charity Directory" description="Audited charities (demo).">
      <PageHero
        eyebrow="Directory"
        title="Trusted charities"
        description="Explore organisations in our review programme (mock data)."
      />
      <section className="container-wide py-16 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoCharities.map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.slug}`}
            className="rounded-2xl border border-border bg-card p-6 hover:shadow-lift transition-shadow"
          >
            {c.logoUrl && (
              <img src={c.logoUrl} alt="" className="h-10 w-auto mb-4" />
            )}
            <h2 className="font-serif text-xl text-primary">{c.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{c.country}</p>
            <Badge className="mt-3" variant={c.auditStatus === "PASSED" ? "default" : "secondary"}>
              {c.auditStatus}
            </Badge>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

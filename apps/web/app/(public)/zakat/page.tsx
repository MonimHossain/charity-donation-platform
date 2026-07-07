"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Quote from "@/components/home/Quote";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import ZakatCalculator from "@/components/zakat/ZakatCalculator";
import { fetchZakatPageContent } from "@/lib/api";
import { USE_MOCK_DATA } from "@/lib/config";

export type ZakatFeatureCard = {
  title: string;
  description: string;
};

export type ZakatPageContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  introHtml: string;
  featureCardsHeading: string;
  featureCards: ZakatFeatureCard[];
  contentBelowHtml: string;
  showQuote: boolean;
  status: string;
};

const FALLBACK_CONTENT: ZakatPageContent = {
  heroEyebrow: "Zakat",
  heroTitle: "Give Zakat with confidence.",
  heroDescription:
    "Your Zakat helps poor families, widows, orphans and refugees — distributed transparently.",
  introHtml: "",
  featureCardsHeading: "What Zakat supports",
  featureCards: [
    { title: "Food, shelter & medical care", description: "For families struggling to survive each day." },
    { title: "Children's education & clothing", description: "Sponsorship that brings dignity and stability." },
    { title: "Skills & livelihood projects", description: "Long-term relief that breaks the cycle of poverty." },
  ],
  contentBelowHtml: "",
  showQuote: true,
  status: "published",
};

export default function ZakatPage() {
  const [content, setContent] = useState<ZakatPageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (USE_MOCK_DATA) {
          if (!cancelled) setContent(FALLBACK_CONTENT);
          return;
        }
        const data = await fetchZakatPageContent();
        if (!cancelled) setContent(data);
      } catch {
        if (!cancelled) setContent(FALLBACK_CONTENT);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const page = content ?? FALLBACK_CONTENT;

  if (loading && !USE_MOCK_DATA) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageShell
      title="Zakat — Your Impact Foundation"
      description={page.heroDescription || "Calculate and give your Zakat with confidence."}
    >
      <PageHero
        eyebrow={page.heroEyebrow}
        title={page.heroTitle}
        description={page.heroDescription}
      />

      {page.introHtml?.trim() && (
        <section className="container-wide pt-12 pb-4 max-w-3xl">
          <MarkdownRenderer content={page.introHtml} className="prose prose-lg max-w-none text-foreground/90" />
        </section>
      )}

      <section className="container-wide py-12 lg:py-20 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-6">
          {page.featureCards.length > 0 && (
            <>
              <h2 className="font-serif text-4xl text-primary">{page.featureCardsHeading}</h2>
              {page.featureCards.map((card) => (
                <div key={card.title} className="p-6 rounded-2xl bg-secondary border border-border">
                  <h3 className="font-serif text-xl text-primary">{card.title}</h3>
                  <p className="text-muted-foreground mt-1">{card.description}</p>
                </div>
              ))}
            </>
          )}
          <Button asChild size="lg" className="rounded-full bg-accent hover:bg-primary hover:text-primary-foreground">
            <Link href="/donate?cause=zakat">Donate Zakat Online</Link>
          </Button>
        </div>
        <div className="lg:col-span-7">
          <ZakatCalculator />
        </div>
      </section>

      {page.contentBelowHtml?.trim() && (
        <section className="container-wide pb-20 max-w-3xl">
          <MarkdownRenderer
            content={page.contentBelowHtml}
            className="prose prose-lg max-w-none text-foreground/90"
          />
        </section>
      )}

      {page.showQuote && <Quote />}
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { Heart, ArrowRight, Droplets, UtensilsCrossed, GraduationCap, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/lib/currency";

const presetAmounts = [10, 30, 50, 100];

const impactAmounts = [10, 30, 50, 100];

const impactLabels = [
  "Feeds a family for a week",
  "Provides clean water for 30 people",
  "Sponsors an orphan for a month",
  "Funds a child's education",
];

const impactIcons = [UtensilsCrossed, Droplets, Baby, GraduationCap];

export default function MonthlyUpsell() {
  const { formatMoney } = useCurrency();

  return (
    <section className="container-wide py-16 sm:py-20 lg:py-24">
      <div className="relative rounded-3xl gradient-plum overflow-hidden p-8 sm:p-12 lg:p-16">
        <div aria-hidden className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-primary-foreground">
            <p className="text-sm uppercase tracking-[0.25em] text-accent font-semibold">Recurring Giving</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
              Make it <span className="text-accent">monthly</span>.
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-md leading-relaxed">
              Monthly donations provide consistent, reliable support to families in crisis. Set up a recurring gift and make a lasting impact.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {presetAmounts.map((amount) => (
                <Link
                  key={amount}
                  href={`/donate?amount=${amount}&freq=monthly`}
                  className="px-5 py-2.5 rounded-full bg-primary-foreground/10 text-primary-foreground font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {formatMoney(amount, { from: "GBP" })}/mo
                </Link>
              ))}
            </div>

            <div className="mt-6">
              <Button asChild size="lg" className="rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground">
                <Link href="/donate?freq=monthly">
                  <Heart className="w-5 h-5" /> Start Monthly Giving <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {impactAmounts.map((amount, i) => {
              const Icon = impactIcons[i] ?? UtensilsCrossed;
              return (
                <div key={impactLabels[i]} className="flex items-start gap-3 p-4 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                  <div className="grid place-items-center w-10 h-10 rounded-full bg-accent/20 text-accent shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-primary-foreground">{formatMoney(amount, { from: "GBP" })}</p>
                    <p className="text-sm text-primary-foreground/70">{impactLabels[i]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

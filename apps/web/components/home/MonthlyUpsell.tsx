"use client";

import Link from "next/link";
import { Heart, ArrowRight, Droplets, UtensilsCrossed, GraduationCap, Baby } from "lucide-react";
import { Button } from "@/components/ui/button";

const presets = [
  { amount: 10, label: "£10/mo" },
  { amount: 30, label: "£30/mo" },
  { amount: 50, label: "£50/mo" },
  { amount: 100, label: "£100/mo" },
];

const impacts = [
  { icon: UtensilsCrossed, amount: "£10", label: "Feeds a family for a week" },
  { icon: Droplets, amount: "£30", label: "Provides clean water for 30 people" },
  { icon: Baby, amount: "£50", label: "Sponsors an orphan for a month" },
  { icon: GraduationCap, amount: "£100", label: "Funds a child's education" },
];

export default function MonthlyUpsell() {
  return (
    <section className="container-wide py-16 sm:py-20 lg:py-24">
      <div className="relative rounded-3xl gradient-plum overflow-hidden p-8 sm:p-12 lg:p-16">
        <div aria-hidden className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-accent/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div className="text-primary-foreground">
            <p className="text-sm uppercase tracking-[0.25em] text-accent font-semibold">Recurring Giving</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl leading-tight">
              Make it <span className="text-accent">monthly</span>.
            </h2>
            <p className="mt-4 text-primary-foreground/80 max-w-md leading-relaxed">
              Monthly donations provide consistent, reliable support to families in crisis. Set up a recurring gift and make a lasting impact.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {presets.map((p) => (
                <Link
                  key={p.amount}
                  href={`/donate?amount=${p.amount}&freq=monthly`}
                  className="px-5 py-2.5 rounded-full bg-primary-foreground/10 text-primary-foreground font-bold text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {p.label}
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

          {/* Right: impact cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            {impacts.map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4 rounded-2xl bg-primary-foreground/5 backdrop-blur-sm">
                <div className="grid place-items-center w-10 h-10 rounded-full bg-accent/20 text-accent shrink-0">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-primary-foreground">{item.amount}</p>
                  <p className="text-sm text-primary-foreground/70">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

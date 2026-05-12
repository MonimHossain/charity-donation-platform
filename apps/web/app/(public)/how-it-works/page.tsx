"use client";

import {
  BadgeCheck,
  FileCheck2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Users,
} from "lucide-react";

const steps = [
  {
    title: "Application Intake",
    detail:
      "Charities submit a complete application package including governance documentation, financial statements, and evidence of compliant fund management. We review the submission for completeness before proceeding.",
    icon: FileCheck2,
  },
  {
    title: "Evidence Review",
    detail:
      "Our auditors systematically assess the submitted documentation against our Audit Framework, covering financial governance, programme effectiveness, ethical fundraising, and compliance.",
    icon: ShieldCheck,
  },
  {
    title: "Field Assessment",
    detail:
      "An appointed assessor conducts an on-site or virtual assessment to verify programme delivery, operational controls, and beneficiary stewardship.",
    icon: SearchCheck,
  },
  {
    title: "Certification Panel",
    detail:
      "An independent certification panel reviews the full audit record and issues a formal certification determination. All decisions are published in the public registry.",
    icon: Users,
  },
  {
    title: "Public Reporting",
    detail:
      "Approved outcomes are documented and published in the public registry to strengthen donor confidence and sector accountability.",
    icon: BadgeCheck,
  },
  {
    title: "Annual Renewal",
    detail:
      "All certifications carry a 12-month validity period. Charities must complete a full renewal assessment each year to maintain certified status.",
    icon: RefreshCw,
  },
];

export default function HowItWorksPage() {
  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Audit Process
          </p>
          <div className="mt-4 h-0.5 w-12 bg-[var(--lime)]" />
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl">
            How Our Audit & Certification Works
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We follow a structured, evidence-based methodology designed to
            ensure accountability, compliance, operational credibility, and
            mission integrity throughout the certification journey.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 md:py-20">
        <div className="relative space-y-8">
          <div className="absolute left-7 top-0 bottom-0 w-0.5 bg-border md:left-1/2 md:-translate-x-px" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLeft = index % 2 === 0;

            return (
              <div
                key={step.title}
                className={`relative flex w-full ${isLeft ? "md:justify-start" : "md:justify-end"}`}
              >
                <div className="absolute left-7 top-0 z-10 -translate-x-1/2 md:left-1/2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-card text-primary shadow-sm">
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>
                </div>

                <div
                  className={`ml-16 w-full md:ml-0 md:w-[calc(50%-56px)] ${isLeft ? "md:pr-6" : "md:pl-6"}`}
                >
                  <div className="rounded-2xl border bg-card p-6 shadow-sm">
                    <div className="flex h-10 min-w-[46px] w-fit items-center justify-center rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

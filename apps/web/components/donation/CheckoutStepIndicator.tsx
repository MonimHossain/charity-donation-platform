"use client";

import { cn } from "@/lib/utils";

export type CheckoutFlowStep = "gift-aid" | "details" | "payment";

type StepDef = { id: CheckoutFlowStep; label: string };

type Props = {
  steps: StepDef[];
  current: CheckoutFlowStep;
};

export default function CheckoutStepIndicator({ steps, current }: Props) {
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <div className="pt-6 border-t border-border">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((step, index) => {
          const active = step.id === current;
          const completed = index < currentIndex;
          return (
            <div key={step.id} className="text-center">
              <p
                className={cn(
                  "text-sm font-medium",
                  active || completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </p>
              <div
                className={cn(
                  "mt-2 h-1 rounded-full transition-colors",
                  active ? "bg-accent" : completed ? "bg-accent/50" : "bg-border"
                )}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";
import CheckoutStepIndicator, { type CheckoutFlowStep } from "./CheckoutStepIndicator";

type Props = {
  currencySymbol: string;
  donationAmount: number;
  giftAid: boolean;
  onGiftAidChange: (value: boolean) => void;
  showUpsells: boolean;
  upsells: CampaignUpsell[];
  selectedUpsellIds: Set<string>;
  onToggleUpsell: (id: string) => void;
  onNext: () => void;
  onPrevious?: () => void;
  flowSteps: Array<{ id: CheckoutFlowStep; label: string }>;
};

export default function CheckoutGiftAidStep({
  currencySymbol,
  donationAmount,
  giftAid,
  onGiftAidChange,
  showUpsells,
  upsells,
  selectedUpsellIds,
  onToggleUpsell,
  onNext,
  onPrevious,
  flowSteps,
}: Props) {
  const withGiftAid = +(donationAmount * 1.25).toFixed(2);

  return (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-10 shadow-soft space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
          Increase your donation, at no extra cost!
        </h2>
        <p
          className="text-3xl md:text-4xl text-accent font-bold"
          style={{ fontFamily: "cursive, 'Brush Script MT', 'Segoe Script', sans-serif" }}
        >
          giftaid it
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          If you are a UK taxpayer the value of your gift can increase by{" "}
          <strong className="text-foreground">25% at no extra cost to you!</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your Donation</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {currencySymbol}
            {donationAmount.toFixed(2)}
          </p>
        </div>
        <ArrowRight className="w-6 h-6 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground mb-1">With Gift Aid becomes</p>
          <p className="text-2xl font-bold tabular-nums text-accent">
            {currencySymbol}
            {withGiftAid.toFixed(2)}
          </p>
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer rounded-2xl bg-secondary/60 border border-border px-4 py-3.5">
        <input
          type="checkbox"
          checked={giftAid}
          onChange={(e) => onGiftAidChange(e.target.checked)}
          className="h-5 w-5 shrink-0 accent-accent rounded"
        />
        <span className="text-sm font-medium text-foreground">Please claim Gift Aid on my donation</span>
      </label>

      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          I am a UK taxpayer and I understand that if I pay less Income and/or Capital Gains Tax than
          the amount of Gift Aid claimed on all my donations in the relevant tax year, it is my
          responsibility to pay any difference.
        </p>
        <p>
          I understand that Gift Aid will fund administrative costs as well as our charitable
          programmes.
        </p>
      </div>

      {showUpsells && upsells.length > 0 && (
        <div className="rounded-2xl bg-secondary/50 border border-border p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground text-center">Please support us further</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {upsells.map((upsell) => {
              const selected = selectedUpsellIds.has(upsell.id);
              return (
                <label
                  key={upsell.id}
                  className={cn(
                    "flex items-start gap-3 cursor-pointer rounded-xl border bg-card px-4 py-3.5 transition-colors",
                    selected ? "border-accent ring-1 ring-accent/30" : "border-border hover:border-accent/40"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleUpsell(upsell.id)}
                    className="mt-0.5 h-4 w-4 accent-accent rounded shrink-0"
                  />
                  <span className="text-sm font-medium text-foreground leading-snug">
                    {upsell.label}
                    {upsell.amount > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        — {currencySymbol}
                        {Number(upsell.amount).toFixed(0)}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="rounded-full min-w-[120px] border-accent text-accent hover:bg-accent/10"
          >
            Previous
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          className="rounded-full min-w-[120px] bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Next
        </Button>
      </div>

      <CheckoutStepIndicator steps={flowSteps} current="gift-aid" />
    </div>
  );
}

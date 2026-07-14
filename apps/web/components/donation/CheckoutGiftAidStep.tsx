"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";
import { formatMoney, normalizeCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { imageAltFromSrc } from "@/lib/utils";
import CheckoutStepIndicator, { type CheckoutFlowStep } from "./CheckoutStepIndicator";
import CheckoutUpsellList from "./CheckoutUpsellList";

type Props = {
  currencySymbol: string;
  displayCurrency: CurrencyCode | string;
  sourceCurrency?: CurrencyCode | string;
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
  displayCurrency,
  sourceCurrency = "GBP",
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
  const withGiftAid = Math.ceil(donationAmount * 1.25);

  return (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-10 shadow-soft space-y-8 max-w-xl mx-auto w-full min-w-0">
      <div className="text-center space-y-4">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground leading-snug">
          Increase your donation, at no extra cost!
        </h2>
        <Image
          src="/images/giftaid-it.png"
          alt={imageAltFromSrc("/images/giftaid-it.png")}
          width={220}
          height={64}
          className="mx-auto h-12 md:h-14 w-auto"
        />
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          If you are a UK taxpayer the value of your gift can increase by{" "}
          <strong className="text-foreground">25% at no extra cost to you!</strong>
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-center">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Your Donation</p>
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {formatMoney(donationAmount, { code: normalizeCurrencyCode(displayCurrency) })}
          </p>
        </div>
        <ArrowRight className="w-6 h-6 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm text-muted-foreground mb-1">With Gift Aid becomes</p>
          <p className="text-2xl font-bold tabular-nums text-accent">
            {formatMoney(withGiftAid, { code: normalizeCurrencyCode(displayCurrency) })}
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
        <div className="rounded-2xl bg-secondary/50 border border-border p-5 space-y-4 min-w-0 overflow-hidden">
          <p className="text-sm font-semibold text-foreground text-center">Please support us further</p>
          <CheckoutUpsellList
            upsells={upsells}
            selectedUpsellIds={selectedUpsellIds}
            currencySymbol={currencySymbol}
            displayCurrency={displayCurrency}
            sourceCurrency={sourceCurrency}
            onToggleUpsell={onToggleUpsell}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        {onPrevious && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            className="rounded-full min-w-[120px] border-accent text-accent hover:bg-primary hover:text-primary-foreground"
          >
            Previous
          </Button>
        )}
        <Button
          type="button"
          onClick={onNext}
          className="rounded-full min-w-[120px] bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
        >
          Next
        </Button>
      </div>

      <CheckoutStepIndicator steps={flowSteps} current="gift-aid" />
    </div>
  );
}

"use client";

import type { CampaignUpsell } from "@/lib/checkout-campaign-config";
import { convertAmount, formatMoney, normalizeCurrencyCode, type CurrencyCode } from "@/lib/currency";

type Props = {
  upsells: CampaignUpsell[];
  selectedUpsellIds: Set<string>;
  currencySymbol: string;
  displayCurrency: CurrencyCode | string;
  sourceCurrency?: CurrencyCode | string;
  onToggleUpsell: (id: string) => void;
};

export default function CheckoutUpsellList({
  upsells,
  selectedUpsellIds,
  displayCurrency,
  sourceCurrency = "GBP",
  onToggleUpsell,
}: Props) {
  if (!upsells.length) return null;

  const displayCode = normalizeCurrencyCode(displayCurrency);
  const fromCode = normalizeCurrencyCode(sourceCurrency);

  return (
    <div className="grid gap-3">
      {upsells.map((upsell) => {
        const selected = selectedUpsellIds.has(upsell.id);
        const title = upsell.name || upsell.label || "Upsell";
        const displayAmount = convertAmount(Number(upsell.amount || 0), fromCode, displayCode);
        return (
          <label
            key={upsell.id}
            className={`flex items-start gap-3 cursor-pointer rounded-2xl border bg-card p-4 transition-colors ${
              selected ? "border-accent ring-1 ring-accent/30" : "border-border hover:border-accent/40"
            }`}
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleUpsell(upsell.id)}
              className="mt-1 h-4 w-4 accent-accent rounded shrink-0"
            />
            {upsell.image ? (
              <img
                src={upsell.image}
                alt=""
                className="h-16 w-16 rounded-xl object-cover shrink-0 bg-muted"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-muted shrink-0" />
            )}
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              {upsell.description?.trim() && (
                <span className="mt-1 block text-xs text-muted-foreground leading-relaxed">
                  {upsell.description}
                </span>
              )}
            </span>
            <span className="shrink-0 text-sm font-bold text-accent tabular-nums">
              {formatMoney(displayAmount, { code: displayCode })}
            </span>
          </label>
        );
      })}
    </div>
  );
}

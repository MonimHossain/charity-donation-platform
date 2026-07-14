"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";
import { convertAmount, formatMoney, normalizeCurrencyCode, type CurrencyCode } from "@/lib/currency";
import { cn, imageAltFromSrc } from "@/lib/utils";

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  if (!upsells.length) return null;

  const displayCode = normalizeCurrencyCode(displayCurrency);
  const fromCode = normalizeCurrencyCode(sourceCurrency);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-2 min-w-0">
      {upsells.map((upsell) => {
        const selected = selectedUpsellIds.has(upsell.id);
        const expanded = expandedIds.has(upsell.id);
        const title = upsell.name || upsell.label || "Upsell";
        const displayAmount = convertAmount(Number(upsell.amount || 0), fromCode, displayCode);
        const hasDescription = Boolean(upsell.description?.trim());

        return (
          <div
            key={upsell.id}
            className={cn(
              "min-w-0 max-w-full overflow-hidden rounded-xl border bg-card transition-colors",
              selected ? "border-accent ring-1 ring-accent/30" : "border-border hover:border-accent/40"
            )}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 min-w-0 max-w-full">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggleUpsell(upsell.id)}
                className="h-3.5 w-3.5 accent-accent rounded shrink-0"
                aria-label={`Add ${title}`}
              />
              {upsell.image ? (
                <img
                  src={upsell.image}
                  alt={imageAltFromSrc(upsell.image)}
                  className="h-10 w-10 rounded-lg object-cover shrink-0 bg-muted"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
              )}
              <div className="min-w-0 flex-1 overflow-hidden">
                <span
                  className="block truncate text-sm font-medium text-foreground"
                  title={title}
                >
                  {title}
                </span>
                <span className="mt-0.5 block text-sm font-bold text-accent tabular-nums sm:hidden">
                  {formatMoney(displayAmount, { code: displayCode })}
                </span>
              </div>
              <span className="hidden sm:inline shrink-0 text-sm font-bold text-accent tabular-nums whitespace-nowrap">
                {formatMoney(displayAmount, { code: displayCode })}
              </span>
              {hasDescription && (
                <button
                  type="button"
                  onClick={() => toggleExpanded(upsell.id)}
                  className="shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label={expanded ? "Collapse details" : "Expand details"}
                  aria-expanded={expanded}
                >
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>
            {expanded && upsell.description?.trim() && (
              <div className="px-3 pb-3 pt-0 border-t border-border/60 mx-3">
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">{upsell.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

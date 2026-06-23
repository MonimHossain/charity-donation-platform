"use client";

import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import type { QuickDonateDisplayPrice } from "@/lib/hooks/useQuickDonateForm";

interface QuickDonatePricePickerProps {
  sourceCurrency: string;
  displayPrices: QuickDonateDisplayPrice[];
  showPresets: boolean;
  showCustomAmount: boolean;
  amount: number;
  custom: string;
  customAmountActive: boolean;
  selectedPresetDescription: string;
  onSelectAmount: (sourceAmount: number, description?: string) => void;
  onOpenCustom: () => void;
  onUpdateCustom: (value: string) => void;
  dark?: boolean;
  compact?: boolean;
}

export function QuickDonatePricePicker({
  sourceCurrency,
  displayPrices,
  showPresets,
  showCustomAmount,
  amount,
  custom,
  customAmountActive,
  selectedPresetDescription,
  onSelectAmount,
  onOpenCustom,
  onUpdateCustom,
  dark = false,
  compact = false,
}: QuickDonatePricePickerProps) {
  const { symbol, formatFromSource } = useCurrency();

  const showDescription = Boolean(
    selectedPresetDescription.trim() && amount > 0 && !customAmountActive
  );

  const presetButtonClass = (active: boolean) =>
    cn(
      compact ? "py-2.5 text-sm" : "py-3 text-sm sm:text-base",
      "rounded-xl font-bold transition-all min-w-[60px] px-3",
      active
        ? "bg-accent text-accent-foreground scale-[1.02] shadow-glow"
        : dark
          ? "bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
          : "bg-secondary text-foreground hover:bg-secondary/70"
    );

  const showCustomInput =
    showCustomAmount && (customAmountActive || (!showPresets && showCustomAmount));

  return (
    <div className="space-y-3">
      {showPresets && (
        <div className={cn("flex flex-wrap gap-1.5", !compact && "gap-2")}>
          {displayPrices.map((p) => {
            const active = !customAmountActive && amount === p.sourceAmount;
            return (
              <button
                key={`${p.sourceAmount}-${p.description ?? ""}-${p.sortOrder}`}
                type="button"
                onClick={() => onSelectAmount(p.sourceAmount, p.description)}
                className={cn(presetButtonClass(active), "flex-1")}
              >
                {symbol}
                {p.displayAmount}
              </button>
            );
          })}
          {showCustomAmount && (
            <button
              type="button"
              onClick={onOpenCustom}
              className={cn(presetButtonClass(customAmountActive), "flex-1")}
            >
              Others
            </button>
          )}
        </div>
      )}

      {showDescription && (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3",
            dark ? "border-primary-foreground/15 bg-primary-foreground/10" : "border-border bg-secondary/40"
          )}
        >
          <p className={cn("text-sm", dark ? "text-primary-foreground/80" : "text-muted-foreground")}>
            {selectedPresetDescription}
          </p>
        </div>
      )}

      {showCustomInput && (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-semibold shrink-0",
              dark ? "text-primary-foreground/80" : "text-muted-foreground"
            )}
          >
            {symbol}
          </span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={custom}
            onChange={(e) => onUpdateCustom(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={`Enter amount (${formatFromSource(1, sourceCurrency).replace(/[\d.,\s]/g, "") || symbol})`}
            className={cn(
              "flex-1 px-3 py-2 rounded-xl text-sm bg-transparent border focus:outline-none focus:ring-2 focus:ring-accent",
              dark
                ? "border-primary-foreground/25 text-primary-foreground placeholder:text-primary-foreground/50"
                : "border-border placeholder:text-muted-foreground"
            )}
            aria-label="Custom amount"
          />
        </div>
      )}
    </div>
  );
}

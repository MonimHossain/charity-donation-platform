"use client";

import { cn } from "@/lib/utils";
import type { CampaignAttribute } from "@/components/campaigns/campaign-detail-types";

interface QuickDonateAttributePillsProps {
  attributes: CampaignAttribute[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  dark?: boolean;
  /** Hero home banner — matches legacy Single / Monthly toggle styling */
  appearance?: "default" | "frequency";
  /** Show pills when there is only one campaign attribute */
  showWhenSingle?: boolean;
}

export function QuickDonateAttributePills({
  attributes,
  selectedIndex,
  onSelect,
  dark = false,
  appearance = "default",
  showWhenSingle = false,
}: QuickDonateAttributePillsProps) {
  if (attributes.length === 0) return null;
  if (attributes.length === 1 && !showWhenSingle) return null;

  if (appearance === "frequency") {
    return (
      <div className="flex p-0.5 rounded-full bg-secondary">
        {attributes.map((attr, i) => (
          <button
            key={attr.id}
            type="button"
            onClick={() => onSelect(i)}
            title={attr.description || attr.name}
            className={cn(
              "flex-1 min-w-0 px-2 sm:px-3 py-1.5 text-[10px] sm:text-[11px] font-bold rounded-full transition-colors",
              "leading-tight whitespace-normal text-center line-clamp-2",
              selectedIndex === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {attr.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full border p-1 flex",
        dark ? "border-primary-foreground/20 bg-primary-foreground/10" : "border-primary/30 bg-secondary"
      )}
    >
      {attributes.map((attr, i) => (
        <button
          key={attr.id}
          type="button"
          onClick={() => onSelect(i)}
          title={attr.description || attr.name}
          className={cn(
            "flex-1 min-w-0 py-2 px-2 rounded-full text-xs sm:text-sm font-semibold transition-colors",
            "leading-tight whitespace-normal text-center line-clamp-2",
            selectedIndex === i
              ? dark
                ? "bg-accent text-accent-foreground shadow-sm"
                : "bg-accent text-accent-foreground shadow-sm"
              : dark
                ? "text-primary-foreground/70 hover:text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
          )}
        >
          {attr.name}
        </button>
      ))}
    </div>
  );
}

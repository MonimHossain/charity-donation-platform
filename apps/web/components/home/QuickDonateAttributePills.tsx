"use client";

import { cn } from "@/lib/utils";
import type { CampaignAttribute } from "@/components/campaigns/campaign-detail-types";

interface QuickDonateAttributePillsProps {
  attributes: CampaignAttribute[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  dark?: boolean;
}

export function QuickDonateAttributePills({
  attributes,
  selectedIndex,
  onSelect,
  dark = false,
}: QuickDonateAttributePillsProps) {
  if (attributes.length <= 1) return null;

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
            "flex-1 min-w-0 py-2 px-2 rounded-full text-xs sm:text-sm font-semibold transition-colors truncate",
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

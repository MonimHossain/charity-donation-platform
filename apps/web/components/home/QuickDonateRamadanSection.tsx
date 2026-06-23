"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { DEFAULT_RAMADAN_CONFIG, type RamadanSplitConfig } from "@/lib/campaign-experience";
import {
  buildRamadanCalendarDates,
  formatRamadanStartPill,
  getRamadanAdminConfig,
  getRamadanPresetDates,
  type RamadanGivingPreset,
} from "@/lib/ramadan-split";
import { useRamadanRegion, type RamadanRegionId } from "@/lib/ramadan-region";
import type { QuickDonateCampaignPayload } from "@/lib/quick-donate-campaign";

export type QuickDonateGivingOption = RamadanGivingPreset | "custom";

export const QUICK_DONATE_GIVING_OPTIONS: Array<{ id: QuickDonateGivingOption; label: string }> = [
  { id: "all_30", label: "Maximize Blessings All 30 Nights" },
  { id: "last_10", label: "Popular Last 10 Nights" },
  { id: "odd_5", label: "Sunnah Last 5 Odd Nights" },
  { id: "custom", label: "Custom" },
];

function pillClass(active: boolean, compact?: boolean) {
  return cn(
    compact ? "rounded-xl px-3 py-2 text-[11px] sm:text-xs" : "rounded-full px-4 py-3 text-sm",
    "font-semibold transition-colors text-center border",
    active
      ? "bg-primary text-primary-foreground border-primary shadow-sm"
      : "bg-secondary/60 text-foreground border-border hover:border-primary/40"
  );
}

interface QuickDonateRamadanSectionProps {
  campaign: QuickDonateCampaignPayload;
  givingOption: QuickDonateGivingOption;
  selectedDates: string[];
  onGivingOptionChange: (option: QuickDonateGivingOption) => void;
  onSelectedDatesChange: (dates: string[]) => void;
  compact?: boolean;
  dark?: boolean;
}

export function QuickDonateRamadanSection({
  campaign,
  givingOption,
  selectedDates,
  onGivingOptionChange,
  onSelectedDatesChange,
  compact = false,
  dark = false,
}: QuickDonateRamadanSectionProps) {
  const { regionId, setRegionId } = useRamadanRegion();
  const config = { ...DEFAULT_RAMADAN_CONFIG, ...(campaign.experienceConfig as RamadanSplitConfig) };
  const experience = {
    type: "ramadan_split" as const,
    ...config,
    campaignId: campaign.id,
    currency: campaign.currency,
  };
  const { maxNights, startChoices } = getRamadanAdminConfig(experience, regionId);
  const calendarDates = useMemo(() => {
    const { ramadanStartDate } = getRamadanAdminConfig(experience, regionId);
    return buildRamadanCalendarDates(ramadanStartDate, maxNights);
  }, [experience, regionId, maxNights]);

  const selectedOrdered = useMemo(
    () => calendarDates.filter((d) => selectedDates.includes(d)),
    [calendarDates, selectedDates]
  );

  function selectGivingOption(option: QuickDonateGivingOption) {
    onGivingOptionChange(option);
    if (option !== "custom") {
      onSelectedDatesChange(getRamadanPresetDates(option, calendarDates));
    }
  }

  function toggleDate(date: string) {
    onGivingOptionChange("custom");
    const next = selectedDates.includes(date)
      ? selectedDates.filter((d) => d !== date)
      : selectedDates.length >= maxNights
        ? selectedDates
        : [...selectedDates, date].sort();
    onSelectedDatesChange(next);
  }

  const labelClass = cn(
    "text-[10px] font-bold uppercase tracking-wider px-1",
    dark ? "text-primary-foreground/70" : "text-muted-foreground"
  );

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <p className={labelClass}>Ramadan starts from</p>
        <div className="flex flex-col gap-1.5">
          {startChoices.map((choice) => {
            const choiceRegion = (choice.region ?? choice.id) as RamadanRegionId;
            const active = regionId === choiceRegion;
            return (
              <button
                key={choiceRegion}
                type="button"
                onClick={() => setRegionId(choiceRegion)}
                className={pillClass(active, compact)}
              >
                {formatRamadanStartPill(choice.date)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className={labelClass}>Customize your {maxNights} nights of giving</p>
        <div className="flex flex-col gap-1.5">
          {QUICK_DONATE_GIVING_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => selectGivingOption(opt.id)}
              className={cn(pillClass(givingOption === opt.id, compact), "text-left")}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {givingOption === "custom" && (
        <div
          className={cn(
            "rounded-xl border p-2.5",
            dark ? "border-primary-foreground/15 bg-primary-foreground/10" : "border-border bg-secondary/30"
          )}
        >
          <p className={cn("text-[10px] mb-2", dark ? "text-primary-foreground/70" : "text-muted-foreground")}>
            Tap nights to include ({selectedOrdered.length} selected)
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {calendarDates.map((date) => {
              const selected = selectedDates.includes(date);
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => toggleDate(date)}
                  className={cn(
                    "rounded-lg py-1.5 px-0.5 text-center text-[10px] font-semibold border transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground border-primary"
                      : dark
                        ? "bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground/80"
                        : "bg-background border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <span className="block opacity-80">
                    {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { month: "short" })}
                  </span>
                  <span className="block text-xs tabular-nums">
                    {new Date(`${date}T12:00:00`).getDate()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

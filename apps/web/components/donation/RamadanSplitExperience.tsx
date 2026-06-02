"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Eye } from "lucide-react";
import { toast } from "sonner";

import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addDonationCartItem } from "@/lib/stores/donationCartStore";
import {
  buildRamadanCalendarDates,
  buildRamadanNightPreview,
  buildRecurringDonationPlan,
  clampWeight,
  formatRamadanDate,
  getRamadanAdminConfig,
  parseWeightInput,
} from "@/lib/ramadan-split";
import RamadanPreviewModal from "@/components/donation/RamadanPreviewModal";
import type { DonationExperienceRamadanSplit, DonationPageDto } from "@icac/shared-types";

const PRESET_AMOUNTS = [40, 50, 100, 250, 500, 1000, 5000];

export default function RamadanSplitExperience({
  page,
  experience,
}: {
  page: DonationPageDto;
  experience: DonationExperienceRamadanSplit;
}) {
  const router = useRouter();
  const { ramadanStartDate, maxNights } = getRamadanAdminConfig(experience);
  const calendarDates = useMemo(
    () => buildRamadanCalendarDates(ramadanStartDate, maxNights),
    [ramadanStartDate, maxNights]
  );

  const [selectedDates, setSelectedDates] = useState<string[]>(() => [...calendarDates]);
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState("");
  const [customizeWeights, setCustomizeWeights] = useState(false);
  const [weights, setWeights] = useState<number[]>(() => calendarDates.map(() => 1));
  const [previewOpen, setPreviewOpen] = useState(false);

  const currency = experience.currency ?? page.config?.currency ?? "GBP";
  const baseTotal = customAmount ? Number(customAmount) : amount;

  const selectedOrdered = useMemo(
    () => calendarDates.filter((d) => selectedDates.includes(d)),
    [calendarDates, selectedDates]
  );

  const activeWeights = useMemo(() => {
    return selectedOrdered.map((date) => {
      const idx = calendarDates.indexOf(date);
      return clampWeight(weights[idx] ?? 1);
    });
  }, [selectedOrdered, calendarDates, weights]);

  const nightPreview = useMemo(
    () => buildRamadanNightPreview(selectedOrdered, activeWeights, Number(baseTotal) || 0),
    [selectedOrdered, activeWeights, baseTotal]
  );

  const dailyBreakdown = useMemo(() => nightPreview.map((n) => n.amount), [nightPreview]);

  function toggleDate(date: string) {
    setSelectedDates((prev) => {
      if (prev.includes(date)) {
        return prev.filter((d) => d !== date);
      }
      if (prev.length >= maxNights) return prev;
      return [...prev, date].sort();
    });
  }

  function updateWeightAt(index: number, raw: string) {
    const w = parseWeightInput(raw);
    setWeights((prev) => {
      const next = [...prev];
      while (next.length < calendarDates.length) next.push(1);
      next[index] = w;
      return next;
    });
  }

  const canAdd =
    selectedOrdered.length > 0 &&
    Number.isFinite(baseTotal) &&
    baseTotal > 0 &&
    nightPreview.every((n) => n.amount >= 0);

  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />

        <div className="mt-10 max-w-2xl mx-auto">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft space-y-6">
            <div className="rounded-full bg-accent text-accent-foreground text-center py-3 text-sm font-bold uppercase tracking-wider">
              Split your gift across Ramadan nights
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Amount</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {PRESET_AMOUNTS.map((a) => {
                  const active = !customAmount && amount === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        setAmount(a);
                        setCustomAmount("");
                      }}
                      className={cn(
                        "rounded-xl py-3 text-sm font-bold border transition-colors",
                        active
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-background border-border hover:border-primary/40"
                      )}
                    >
                      £ {a}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomAmount(String(baseTotal || ""))}
                  className={cn(
                    "rounded-xl py-3 text-sm font-bold border transition-colors",
                    customAmount
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  Other
                </button>
              </div>
              <div className="mt-3">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  placeholder="Enter other amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest text-accent-deep font-bold flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Select Ramadan nights
              </p>
              <p className="text-xs text-muted-foreground">
                Ramadan begins {formatRamadanDate(ramadanStartDate)}. Choose up to {maxNights} nights
                ({selectedOrdered.length} selected).
              </p>
              <div className="rounded-2xl border border-border p-3 bg-secondary/30">
                <Input
                  type="date"
                  value={ramadanStartDate}
                  readOnly
                  disabled
                  className="rounded-xl h-11 bg-background mb-3 opacity-80"
                  aria-label="Ramadan start date set by admin"
                />
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
                  {calendarDates.map((date, index) => {
                    const selected = selectedDates.includes(date);
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleDate(date)}
                        className={cn(
                          "rounded-xl py-2 px-1 text-center text-xs font-semibold border transition-colors",
                          selected
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background border-border hover:border-primary/40 text-muted-foreground"
                        )}
                      >
                        <span className="block text-[10px] opacity-80">
                          {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
                            month: "short",
                          })}
                        </span>
                        <span className="block text-sm tabular-nums">
                          {new Date(`${date}T12:00:00`).getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border p-4 space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={customizeWeights}
                  onChange={(e) => setCustomizeWeights(e.target.checked)}
                />
                Customize weight per selected night (default is 1)
              </label>
              {customizeWeights && selectedOrdered.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Weights cannot be negative. Higher weight = larger share of your total.
                  </p>
                  <div className="grid gap-2 max-h-48 overflow-y-auto">
                    {selectedOrdered.map((date) => {
                      const index = calendarDates.indexOf(date);
                      return (
                        <div key={date} className="grid grid-cols-[1fr_80px] gap-2 items-center">
                          <span className="text-xs font-medium truncate">
                            {formatRamadanDate(date)}
                          </span>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step={1}
                            value={weights[index] ?? 1}
                            onChange={(e) => updateWeightAt(index, e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={!canAdd}
                onClick={() => setPreviewOpen(true)}
              >
                <Eye className="w-4 h-4" /> Preview schedule
              </Button>
            </div>

            <Button
              size="lg"
              className="w-full rounded-full bg-accent hover:bg-accent/90 h-14 text-base"
              disabled={!canAdd}
              onClick={() => {
                const recurringPlan = buildRecurringDonationPlan({
                  donationPageId: page.id,
                  donationPageSlug: page.slug,
                  campaignId: experience.campaignId ?? page.campaignId ?? undefined,
                  currency,
                  totalAmount: Number(baseTotal),
                  nights: nightPreview,
                });

                addDonationCartItem({
                  kind: "ramadan_split",
                  donationPageId: page.id,
                  donationPageSlug: page.slug,
                  title: page.title,
                  category: page.category,
                  amount: Number(baseTotal),
                  currency,
                  description: `Ramadan split — ${selectedOrdered.length} nights — £${Number(baseTotal).toFixed(2)}`,
                  campaignId: experience.campaignId ?? page.campaignId ?? undefined,
                  donationType: "ramadan",
                  ramadan: {
                    ramadanStartDate,
                    selectedDates: selectedOrdered,
                    weights: activeWeights,
                    dailyBreakdown,
                    nights: selectedOrdered.length,
                    campaignId: experience.campaignId,
                    notes: `Ramadan split (${selectedOrdered.length} nights)`,
                    recurringPlan,
                  },
                });
                toast.success("Added to cart");
                router.push("/donation/checkout");
              }}
            >
              Add to cart
            </Button>
          </div>
        </div>
      </section>

      <RamadanPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        nights={nightPreview}
        total={Number(baseTotal) || 0}
        currency={currency}
      />
    </PageShell>
  );
}

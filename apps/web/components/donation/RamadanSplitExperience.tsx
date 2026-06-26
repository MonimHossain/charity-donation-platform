"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { toast } from "sonner";

import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addDonationCartItem } from "@/lib/stores/donationCartStore";
import {
  buildEqualRamadanNightPreview,
  buildRamadanCalendarDates,
  buildRecurringDonationPlan,
  formatRamadanStartPill,
  getRamadanAdminConfig,
  getRamadanPresetDates,
  type RamadanGivingPreset,
} from "@/lib/ramadan-split";
import RamadanPreviewModal from "@/components/donation/RamadanPreviewModal";
import type { DonationExperienceRamadanSplit, DonationPageDto } from "@icac/shared-types";
import type { DonationSource } from "@/lib/donation-source";
import { useCurrency } from "@/lib/currency";
import {
  useRamadanRegion,
  type RamadanRegionId,
} from "@/lib/ramadan-region";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";

const PRESET_AMOUNTS = [40, 50, 100, 250, 500, 1000, 5000];

type GivingOption = RamadanGivingPreset | "custom";

const GIVING_OPTIONS: Array<{ id: GivingOption; label: string }> = [
  { id: "all_30", label: "Maximize Blessings All 30 Nights" },
  { id: "last_10", label: "Popular Last 10 Nights" },
  { id: "odd_5", label: "Sunnah Last 5 Odd Nights" },
  { id: "custom", label: "Custom" },
];

function pillClass(active: boolean) {
  return cn(
    "rounded-full border px-4 py-3 text-sm font-semibold transition-colors text-center",
    active
      ? "bg-accent text-accent-foreground border-accent"
      : "bg-background border-accent/50 text-foreground hover:border-accent"
  );
}

export function RamadanSplitForm({
  source,
  experience,
  embedded = false,
  checkoutSettings,
  checkoutUpsells,
}: {
  source: DonationSource;
  experience: DonationExperienceRamadanSplit;
  embedded?: boolean;
  checkoutSettings?: CheckoutSettings;
  checkoutUpsells?: CampaignUpsell[];
}) {
  const router = useRouter();
  const { formatFromSource, convertToDisplay, fromDisplayToSource } = useCurrency();
  const { regionId, regionLabel, setRegionId } = useRamadanRegion();
  const { ramadanStartDate, maxNights, startChoices } = getRamadanAdminConfig(experience, regionId);
  const calendarDates = useMemo(
    () => buildRamadanCalendarDates(ramadanStartDate, maxNights),
    [ramadanStartDate, maxNights]
  );

  const [givingOption, setGivingOption] = useState<GivingOption>("odd_5");
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    getRamadanPresetDates("odd_5", calendarDates)
  );
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");
  const [customAmountMode, setCustomAmountMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewNights, setPreviewNights] = useState<ReturnType<typeof buildEqualRamadanNightPreview>>([]);

  const sourceCurrency = (experience.currency ?? source.currency ?? "GBP").toUpperCase();
  const baseTotal = customAmount
    ? fromDisplayToSource(Number(customAmount), sourceCurrency)
    : amount;
  const campaignId = experience.campaignId ?? source.campaignId ?? source.id;

  useEffect(() => {
    if (givingOption === "custom") {
      setSelectedDates((prev) => prev.filter((d) => calendarDates.includes(d)));
      return;
    }
    setSelectedDates(getRamadanPresetDates(givingOption, calendarDates));
  }, [calendarDates, givingOption, regionId]);

  const selectedOrdered = useMemo(
    () => calendarDates.filter((d) => selectedDates.includes(d)),
    [calendarDates, selectedDates]
  );

  const nightPreview = useMemo(
    () => buildEqualRamadanNightPreview(selectedOrdered, Number(baseTotal) || 0),
    [selectedOrdered, baseTotal]
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

  function selectGivingOption(option: GivingOption) {
    setGivingOption(option);
    if (option !== "custom") {
      setSelectedDates(getRamadanPresetDates(option, calendarDates));
    }
  }

  function openPreviewForOption(option: GivingOption) {
    const dates =
      option === "custom"
        ? selectedOrdered
        : getRamadanPresetDates(option, calendarDates);
    if (dates.length === 0) {
      toast.error("No nights selected to preview");
      return;
    }
    setPreviewNights(buildEqualRamadanNightPreview(dates, Number(baseTotal) || 0));
    setPreviewOpen(true);
  }

  const canDonate =
    selectedOrdered.length > 0 &&
    Number.isFinite(baseTotal) &&
    baseTotal > 0 &&
    nightPreview.every((n) => n.amount >= 0);

  function handleDonate() {
    const recurringPlan = buildRecurringDonationPlan({
      donationPageId: source.id,
      donationPageSlug: source.slug,
      campaignId,
      currency: sourceCurrency,
      totalAmount: Number(baseTotal),
      nights: nightPreview,
    });

    addDonationCartItem({
      kind: "ramadan_split",
      donationPageId: source.id,
      donationPageSlug: source.slug,
      title: source.title,
      category: source.category,
      amount: Number(baseTotal),
      currency: sourceCurrency,
      description: `Ramadan split — ${selectedOrdered.length} nights — ${formatFromSource(nightPreview[0]?.amount ?? 0, sourceCurrency)}/night (${formatFromSource(Number(baseTotal), sourceCurrency)} total)`,
      campaignId,
      donationType: "ramadan",
      checkoutSettings,
      checkoutUpsells,
      ramadan: {
        ramadanStartDate,
        regionId,
        regionLabel,
        selectedDates: selectedOrdered,
        weights: selectedOrdered.map(() => 1),
        dailyBreakdown,
        nights: selectedOrdered.length,
        campaignId,
        notes: `Ramadan split (${selectedOrdered.length} nights)`,
        recurringPlan,
      },
    });
    toast.success("Added to cart");
    router.push("/donation/checkout");
  }

  return (
    <>
      <div className={cn("space-y-5", embedded ? "" : "rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft")}>
        <div className="rounded-full bg-accent text-accent-foreground text-center py-3.5 text-sm font-bold">
          Total is Split Across Nights
        </div>

        {/* Amount */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_AMOUNTS.map((a) => {
            const active = !customAmountMode && !customAmount && amount === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => {
                  setAmount(a);
                  setCustomAmount("");
                  setCustomAmountMode(false);
                }}
                className={pillClass(active)}
              >
                {formatFromSource(a, sourceCurrency)}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setCustomAmountMode(true);
              setCustomAmount(customAmount || String(convertToDisplay(amount, sourceCurrency)));
            }}
            className={pillClass(customAmountMode)}
          >
            Other
          </button>
        </div>
        {customAmountMode && (
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            placeholder="Enter other amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="rounded-full h-11 text-center"
          />
        )}

        {/* Regional start dates */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Ramadan Starts From</p>
          <div className="flex flex-col gap-2">
            {startChoices.map((choice) => {
              const choiceRegion = (choice.region ?? choice.id) as RamadanRegionId;
              const active = regionId === choiceRegion;
              return (
                <button
                  key={choiceRegion}
                  type="button"
                  onClick={() => setRegionId(choiceRegion)}
                  className={pillClass(active)}
                >
                  {formatRamadanStartPill(choice.date)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Giving options */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Customize your {maxNights} nights of giving
          </p>
          <div className="space-y-2">
            {GIVING_OPTIONS.map((opt) => {
              const active = givingOption === opt.id;
              return (
                <div key={opt.id} className="flex gap-2 items-stretch">
                  <button
                    type="button"
                    onClick={() => selectGivingOption(opt.id)}
                    className={cn(pillClass(active), "flex-1 text-left")}
                  >
                    {opt.label}
                  </button>
                  <button
                    type="button"
                    title={`Preview ${opt.label}`}
                    onClick={() => openPreviewForOption(opt.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 flex items-center justify-center transition-colors",
                      active
                        ? "bg-accent/20 border-accent text-accent-deep"
                        : "border-border text-muted-foreground hover:border-accent/50 hover:text-foreground"
                    )}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom calendar */}
        {givingOption === "custom" && (
          <div className="rounded-2xl border border-border p-3 bg-secondary/20">
            <p className="text-xs text-muted-foreground mb-3">
              Tap nights to include ({selectedOrdered.length} selected). Your gift is split equally
              across selected nights.
            </p>
            <div className="grid grid-cols-5 gap-2">
              {calendarDates.map((date) => {
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
                        : "bg-background border-border hover:border-accent/40 text-muted-foreground"
                    )}
                  >
                    <span className="block text-[10px] opacity-80">
                      {new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { month: "short" })}
                    </span>
                    <span className="block text-sm tabular-nums">
                      {new Date(`${date}T12:00:00`).getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="w-full rounded-full bg-accent hover:bg-primary hover:text-primary-foreground h-14 text-base font-bold"
          disabled={!canDonate}
          onClick={handleDonate}
        >
          Donate
        </Button>
      </div>

      <RamadanPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        nights={previewOpen ? previewNights : nightPreview}
        total={Number(baseTotal) || 0}
        currency={sourceCurrency}
      />
    </>
  );
}

export default function RamadanSplitExperience({
  page,
  experience,
}: {
  page: DonationPageDto;
  experience: DonationExperienceRamadanSplit;
}) {
  const source: DonationSource = {
    id: page.id,
    slug: page.slug,
    title: page.title,
    shortDescription: page.shortDescription,
    category: page.category,
    currency: page.config?.currency,
    campaignId: page.campaignId ?? undefined,
  };

  return (
    <PageShell title={page.title} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero eyebrow={page.category} title={page.title} description={page.shortDescription ?? ""} />
        <div className="mt-10 max-w-md mx-auto">
          <RamadanSplitForm source={source} experience={experience} />
        </div>
      </section>
    </PageShell>
  );
}

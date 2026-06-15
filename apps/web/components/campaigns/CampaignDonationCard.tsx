"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  formatRecurrenceLabel,
  DEFAULT_RECURRENCE,
  scheduleToFrequencyParam,
  scheduleToStripeParams,
  type DonorScheduleChoice,
  type PresetAmount,
  type RecurrenceIntervalUnit,
} from "@/lib/campaign-payment-config";
import { recurringIntervalLabel } from "@/lib/stripe-recurring";
import {
  addDonationCartItem,
  clearDonationCart,
} from "@/lib/stores/donationCartStore";
import type { CampaignAttribute, CampaignData } from "./campaign-detail-types";

const DONOR_PRESET_INTERVALS = [
  { value: "daily" as const, label: "Daily" },
  { value: "weekly" as const, label: "Weekly" },
  { value: "monthly" as const, label: "Monthly" },
  { value: "yearly" as const, label: "Annually" },
];

export interface CampaignDonationCardProps {
  campaign: CampaignData;
  sym: string;
  selectedAttr: CampaignAttribute | undefined;
  selectedAttrIdx: number;
  paymentType: "single" | "regular";
  selectedAmount: number;
  customAmount: string;
  selectedPresetDescription: string;
  donorSchedule: DonorScheduleChoice;
  showCustomSchedule: boolean;
  quantity: number;
  customFieldValues: Record<string, string>;
  finalAmount: number;
  onSelectAttribute: (idx: number) => void;
  onSetSelectedAmount: (a: number, description?: string) => void;
  onSetCustomAmount: (a: string) => void;
  onSetDonorSchedule: (schedule: DonorScheduleChoice) => void;
  onSetShowCustomSchedule: (show: boolean) => void;
  onSetQuantity: (q: number) => void;
  onSetCustomFieldValue: (id: string, val: string) => void;
}

function PresetAmountButtons({
  sym,
  presets,
  selectedAmount,
  customAmount,
  selectedDescription,
  onSelect,
}: {
  sym: string;
  presets: PresetAmount[];
  selectedAmount: number;
  customAmount: string;
  selectedDescription: string;
  onSelect: (amount: number, description?: string) => void;
}) {
  const showDescription = Boolean(
    selectedDescription.trim() && selectedAmount > 0 && !customAmount
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2.5">
        {presets.map((preset) => {
          const selected = selectedAmount === preset.amount && !customAmount;
          const description = preset.description?.trim();
          return (
            <button
              key={`${preset.amount}-${description ?? ""}`}
              type="button"
              onClick={() => onSelect(preset.amount, preset.description)}
              className={cn(
                "min-w-[88px] px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all text-center",
                selected
                  ? "bg-accent text-accent-foreground border-accent shadow-sm"
                  : "bg-background border-accent/40 text-foreground hover:border-accent hover:bg-accent/5"
              )}
            >
              <span className="block text-base leading-none">
                {sym}
                {preset.amount.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
      {showDescription && (
        <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3">
          <p className="text-sm text-muted-foreground">{selectedDescription}</p>
        </div>
      )}
    </div>
  );
}

export function CampaignDonationCard({
  campaign,
  sym,
  selectedAttr,
  selectedAttrIdx,
  paymentType,
  selectedAmount,
  customAmount,
  selectedPresetDescription,
  donorSchedule,
  showCustomSchedule,
  quantity,
  customFieldValues,
  finalAmount,
  onSelectAttribute,
  onSetSelectedAmount,
  onSetCustomAmount,
  onSetDonorSchedule,
  onSetShowCustomSchedule,
  onSetQuantity,
  onSetCustomFieldValue,
}: CampaignDonationCardProps) {
  const router = useRouter();
  const total = finalAmount;

  const isRegular = paymentType === "regular" && selectedAttr?.enableRegularPayment;
  const isSingle = paymentType === "single" && selectedAttr?.enableSinglePayment;

  const paymentConfig = isRegular
    ? selectedAttr!.regularPaymentConfig
    : isSingle
      ? selectedAttr!.singlePaymentConfig
      : null;

  const presetAmounts = paymentConfig?.presetAmounts ?? [];

  const showOtherAmount =
    paymentConfig &&
    (paymentConfig.priceType === "custom" || paymentConfig.priceType === "both");

  const showPresets =
    paymentConfig &&
    (paymentConfig.priceType === "preset" || paymentConfig.priceType === "both") &&
    presetAmounts.length > 0;

  const adminRecurrence = selectedAttr?.regularPaymentConfig.recurrence;
  const adminScheduleLabel = adminRecurrence ? formatRecurrenceLabel(adminRecurrence) : "Monthly";

  const frequencyParam = isRegular
    ? scheduleToFrequencyParam(donorSchedule, adminRecurrence)
    : "single";

  const intervalLabel = useMemo(() => {
    if (!isRegular) return "";
    if (donorSchedule.mode === "admin" && adminRecurrence) {
      return formatRecurrenceLabel(adminRecurrence).replace(/^Every /i, "").toLowerCase();
    }
    return recurringIntervalLabel(frequencyParam);
  }, [isRegular, donorSchedule, adminRecurrence, frequencyParam]);

  const recurringStripeParams = isRegular
    ? scheduleToStripeParams(donorSchedule, adminRecurrence ?? DEFAULT_RECURRENCE)
    : null;

  function handleProceedToCheckout() {
    clearDonationCart();
    addDonationCartItem({
      kind: "standard",
      donationPageId: campaign.id,
      donationPageSlug: campaign.slug,
      title: campaign.title,
      amount: total,
      currency: campaign.currency,
      description: `${selectedAttr?.name || campaign.title} — ${sym}${total.toFixed(2)}`,
      campaignId: campaign.id,
      donationType: selectedAttr?.name || campaign.category,
      quantity: selectedAttr?.enableQuantity && quantity > 1 ? quantity : undefined,
      recurringFrequency: isRegular ? frequencyParam : undefined,
      recurringInterval: recurringStripeParams?.interval,
      recurringIntervalCount: recurringStripeParams?.intervalCount,
      recurringCancelAt: recurringStripeParams?.cancelAt,
      checkoutSettings: campaign.checkoutSettings,
      checkoutUpsells: campaign.upsells.filter((u) => u.isActive !== false),
    });
    router.push("/donation/checkout");
  }

  const [customIntervalCount, setCustomIntervalCount] = useState(
    adminRecurrence?.intervalCount ?? 1
  );
  const [customIntervalUnit, setCustomIntervalUnit] = useState<RecurrenceIntervalUnit>(
    adminRecurrence?.intervalUnit ?? "month"
  );

  return (
    <div className="rounded-3xl bg-card border border-border p-6 lg:p-7 shadow-lift space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
          Donate · {campaign.currency}
        </p>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock className="w-3 h-3" /> Secure checkout
        </span>
      </div>

      {campaign.attributes.length > 1 && (
        <div className="rounded-full border border-primary/30 bg-secondary p-1 flex">
          {campaign.attributes.map((attr, i) => (
            <button
              key={attr.id}
              type="button"
              onClick={() => onSelectAttribute(i)}
              title={attr.description || attr.name}
              className={cn(
                "flex-1 min-w-0 py-2.5 px-2 rounded-full text-xs sm:text-sm font-semibold transition-colors truncate",
                selectedAttrIdx === i
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {attr.name}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {isRegular
          ? "Set up a recurring gift — change the schedule below if you prefer a different frequency."
          : "A single donation goes directly to the field."}
      </p>

      {isRegular && adminRecurrence && (
        <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Recurring schedule</p>
          {!showCustomSchedule ? (
            <>
              <p className="text-sm font-semibold">{adminScheduleLabel}</p>
              {adminRecurrence.durationType === "end_date" && adminRecurrence.endDate && (
                <p className="text-xs text-muted-foreground">
                  Ends{" "}
                  {new Date(adminRecurrence.endDate).toLocaleDateString(undefined, {
                    dateStyle: "medium",
                  })}
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full text-xs"
                onClick={() => {
                  onSetShowCustomSchedule(true);
                  onSetDonorSchedule({ mode: "preset", frequency: "monthly" });
                }}
              >
                Choose your own schedule
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {DONOR_PRESET_INTERVALS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onSetDonorSchedule({ mode: "preset", frequency: opt.value })}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs border transition-all",
                      donorSchedule.mode === "preset" && donorSchedule.frequency === opt.value
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-background border-border hover:border-primary/40"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    onSetDonorSchedule({
                      mode: "custom",
                      intervalCount: customIntervalCount,
                      intervalUnit: customIntervalUnit,
                    })
                  }
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    donorSchedule.mode === "custom"
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  Custom
                </button>
              </div>
              {donorSchedule.mode === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">Every</span>
                  <Input
                    type="number"
                    min={1}
                    value={customIntervalCount}
                    onChange={(e) => {
                      const count = Math.max(1, Number(e.target.value));
                      setCustomIntervalCount(count);
                      onSetDonorSchedule({
                        mode: "custom",
                        intervalCount: count,
                        intervalUnit: customIntervalUnit,
                      });
                    }}
                    className="h-8 w-16 text-xs"
                  />
                  <select
                    value={customIntervalUnit}
                    onChange={(e) => {
                      const unit = e.target.value as RecurrenceIntervalUnit;
                      setCustomIntervalUnit(unit);
                      onSetDonorSchedule({
                        mode: "custom",
                        intervalCount: customIntervalCount,
                        intervalUnit: unit,
                      });
                    }}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                  >
                    <option value="day">day(s)</option>
                    <option value="week">week(s)</option>
                    <option value="month">month(s)</option>
                    <option value="year">year(s)</option>
                  </select>
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-0 text-xs text-muted-foreground"
                onClick={() => {
                  onSetShowCustomSchedule(false);
                  onSetDonorSchedule({ mode: "admin" });
                }}
              >
                Use recommended schedule ({adminScheduleLabel})
              </Button>
            </div>
          )}
        </div>
      )}

      {selectedAttr && paymentConfig && (
        <div className="space-y-3">
          {showPresets && (
            <PresetAmountButtons
              sym={sym}
              presets={presetAmounts}
              selectedAmount={selectedAmount}
              customAmount={customAmount}
              selectedDescription={selectedPresetDescription}
              onSelect={(amount, description) => {
                onSetSelectedAmount(amount, description);
                onSetCustomAmount("");
              }}
            />
          )}
          {showOtherAmount && (
            <>
              {showPresets && (
                <button
                  type="button"
                  onClick={() => onSetSelectedAmount(0)}
                  className={cn(
                    "px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all",
                    Boolean(customAmount)
                      ? "bg-accent text-accent-foreground border-accent shadow-sm"
                      : "bg-background border-accent/40 text-foreground hover:border-accent hover:bg-accent/5"
                  )}
                >
                  Other amount
                </button>
              )}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  {sym}
                </span>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => {
                    onSetCustomAmount(e.target.value);
                    onSetSelectedAmount(0);
                  }}
                  className="pl-7 h-10 rounded-xl"
                  min={paymentConfig.minAmount}
                  max={paymentConfig.maxAmount}
                />
              </div>
            </>
          )}
        </div>
      )}

      {selectedAttr?.enableQuantity && (
        <div>
          <Label className="text-xs mb-1.5 block">
            {selectedAttr.quantityConfig.quantityLabel || "Quantity"}
          </Label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() =>
                onSetQuantity(Math.max(selectedAttr.quantityConfig.minQuantity, quantity - 1))
              }
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-bold w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() =>
                onSetQuantity(Math.min(selectedAttr.quantityConfig.maxQuantity, quantity + 1))
              }
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {selectedAttr?.customFields && selectedAttr.customFields.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-border">
          {selectedAttr.customFields.map((cf) => (
            <div key={cf.id} className="space-y-1.5">
              <Label className="text-xs">
                {cf.label}
                {cf.isRequired && <span className="text-destructive ml-0.5">*</span>}
              </Label>
              {cf.fieldType === "text" && (
                <Input
                  value={customFieldValues[cf.id] || ""}
                  onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                  placeholder={cf.placeholder}
                  className="h-10 rounded-xl"
                />
              )}
              {cf.fieldType === "textarea" && (
                <textarea
                  value={customFieldValues[cf.id] || ""}
                  onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                  placeholder={cf.placeholder}
                  rows={2}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              )}
              {cf.fieldType === "number" && (
                <Input
                  type="number"
                  value={customFieldValues[cf.id] || ""}
                  onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                  placeholder={cf.placeholder}
                  className="h-10 rounded-xl"
                />
              )}
              {cf.fieldType === "date" && (
                <Input
                  type="date"
                  value={customFieldValues[cf.id] || ""}
                  onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                  className="h-10 rounded-xl"
                />
              )}
              {cf.fieldType === "dropdown" && (
                <select
                  value={customFieldValues[cf.id] || ""}
                  onChange={(e) => onSetCustomFieldValue(cf.id, e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="">{cf.placeholder || "Select..."}</option>
                  {cf.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}
              {cf.fieldType === "radio" && (
                <div className="flex flex-wrap gap-2">
                  {cf.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => onSetCustomFieldValue(cf.id, opt)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs border transition-all",
                        customFieldValues[cf.id] === opt
                          ? "bg-accent text-accent-foreground border-accent"
                          : "bg-background border-border hover:border-primary/40"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {cf.fieldType === "checkbox" && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={customFieldValues[cf.id] === "true"}
                    onChange={(e) =>
                      onSetCustomFieldValue(cf.id, e.target.checked ? "true" : "false")
                    }
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {cf.placeholder || cf.label}
                </label>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        onClick={handleProceedToCheckout}
        className="w-full rounded-full text-base font-bold h-14 bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground shadow-soft hover:shadow-glow px-10"
      >
        Donate {sym}
        {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        {isRegular && intervalLabel ? `/${intervalLabel}` : ""}
      </Button>

      <div className="flex items-center justify-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3" /> 100% secure
        </span>
        <span>G Pay</span>
        <span>Card</span>
      </div>
    </div>
  );
}

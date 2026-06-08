"use client";

import Link from "next/link";
import { Lock, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { CampaignAttribute, CampaignData } from "./campaign-detail-types";

const DONOR_REGULAR_INTERVALS = ["daily", "weekly", "monthly", "yearly"] as const;
const DONOR_REGULAR_MIN_AMOUNT = 5;
const DONOR_REGULAR_MAX_AMOUNT = 5000;

export interface CampaignDonationCardProps {
  campaign: CampaignData;
  sym: string;
  selectedAttr: CampaignAttribute | undefined;
  selectedAttrIdx: number;
  paymentType: "single" | "regular";
  selectedAmount: number;
  customAmount: string;
  selectedInterval: string;
  quantity: number;
  selectedUpsells: Set<string>;
  customFieldValues: Record<string, string>;
  finalAmount: number;
  upsellTotal: number;
  onSelectAttribute: (idx: number) => void;
  onSetPaymentType: (t: "single" | "regular") => void;
  onSetSelectedAmount: (a: number) => void;
  onSetCustomAmount: (a: string) => void;
  onSetSelectedInterval: (i: string) => void;
  onSetQuantity: (q: number) => void;
  onToggleUpsell: (id: string) => void;
  onSetCustomFieldValue: (id: string, val: string) => void;
}

export function CampaignDonationCard({
  campaign,
  sym,
  selectedAttr,
  selectedAttrIdx,
  paymentType,
  selectedAmount,
  customAmount,
  selectedInterval,
  quantity,
  selectedUpsells,
  customFieldValues,
  finalAmount,
  upsellTotal,
  onSelectAttribute,
  onSetPaymentType,
  onSetSelectedAmount,
  onSetCustomAmount,
  onSetSelectedInterval,
  onSetQuantity,
  onToggleUpsell,
  onSetCustomFieldValue,
}: CampaignDonationCardProps) {
  const cs = campaign.checkoutSettings;
  const total = finalAmount + upsellTotal;

  const donateUrl = `/donate?amount=${total}&cause=${campaign.slug}&campaignId=${campaign.id}&type=${paymentType}${
    paymentType === "regular" ? `&interval=${selectedInterval}` : ""
  }`;

  const presetAmounts =
    paymentType === "single" && selectedAttr?.enableSinglePayment
      ? selectedAttr.singlePaymentConfig.presetAmounts
      : [];

  const showOtherAmount =
    paymentType === "single" &&
    selectedAttr?.enableSinglePayment &&
    (selectedAttr.singlePaymentConfig.priceType === "custom" ||
      selectedAttr.singlePaymentConfig.priceType === "both");

  const impactLine = selectedAttr?.description?.trim();

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

      {selectedAttr && selectedAttr.enableSinglePayment && selectedAttr.enableRegularPayment && (
        <div
          className="rounded-full border border-border p-1 grid"
          style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}
        >
          <button
            type="button"
            onClick={() => {
              onSetPaymentType("single");
              if (selectedAttr.singlePaymentConfig?.presetAmounts?.length > 0) {
                onSetSelectedAmount(selectedAttr.singlePaymentConfig.presetAmounts[0] ?? 0);
              }
              onSetCustomAmount("");
            }}
            className={cn(
              "py-2.5 px-3 rounded-full text-sm font-semibold capitalize transition-all",
              paymentType === "single"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            One-time gift
          </button>
          <button
            type="button"
            onClick={() => {
              onSetPaymentType("regular");
              onSetSelectedAmount(0);
              onSetCustomAmount("");
            }}
            className={cn(
              "py-2.5 px-3 rounded-full text-sm font-semibold capitalize transition-all",
              paymentType === "regular"
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            Monthly support
          </button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        A single donation goes directly to the field.
      </p>

      {selectedAttr && paymentType === "single" && selectedAttr.enableSinglePayment && (
        <div>
          <div className="flex flex-wrap gap-2.5">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  onSetSelectedAmount(amt);
                  onSetCustomAmount("");
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full border-2 text-sm font-bold transition-all",
                  selectedAmount === amt && !customAmount
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-background border-accent/40 text-foreground hover:border-accent hover:bg-accent/5"
                )}
              >
                {sym}
                {amt.toFixed(2)}
              </button>
            ))}
            {showOtherAmount && (
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
                Other
              </button>
            )}
          </div>
          {showOtherAmount && (
            <div className="mt-3 relative">
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
                min={selectedAttr.singlePaymentConfig.minAmount}
                max={selectedAttr.singlePaymentConfig.maxAmount}
              />
            </div>
          )}
        </div>
      )}

      {selectedAttr && paymentType === "regular" && selectedAttr.enableRegularPayment && (
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-1.5 block">How often?</Label>
            <div className="flex flex-wrap gap-2">
              {DONOR_REGULAR_INTERVALS.map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => onSetSelectedInterval(interval)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border capitalize transition-all",
                    selectedInterval === interval
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Amount per payment</Label>
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
                min={DONOR_REGULAR_MIN_AMOUNT}
                max={DONOR_REGULAR_MAX_AMOUNT}
              />
            </div>
          </div>
        </div>
      )}

      {selectedAttr?.enableRegularPayment &&
        paymentType === "regular" &&
        selectedAttr.enableQuantity && (
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

      {impactLine && (
        <div className="rounded-2xl bg-secondary/60 px-5 py-4 text-center">
          <p className="text-sm font-medium text-foreground/85 leading-relaxed">{impactLine}</p>
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

      {cs?.enableUpsell && campaign.upsells.filter((u) => u.isActive).length > 0 && (
        <div className="space-y-2">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">Add to your donation</p>
          {campaign.upsells
            .filter((u) => u.isActive)
            .map((u) => (
              <label
                key={u.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                  selectedUpsells.has(u.id) ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedUpsells.has(u.id)}
                  onChange={() => onToggleUpsell(u.id)}
                  className="h-4 w-4 rounded accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{u.label}</p>
                  {u.description && (
                    <p className="text-xs text-muted-foreground">{u.description}</p>
                  )}
                </div>
                <span className="text-sm font-semibold text-primary">
                  {sym}
                  {u.amount}
                </span>
              </label>
            ))}
        </div>
      )}

      <Button
        asChild
        className="w-full rounded-full text-base font-bold h-14 bg-accent text-accent-foreground hover:bg-accent-deep hover:text-primary-foreground shadow-soft hover:shadow-glow px-10"
      >
        <Link href={donateUrl}>
          Donate {sym}
          {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {paymentType === "regular" ? `/${selectedInterval}` : ""}
        </Link>
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

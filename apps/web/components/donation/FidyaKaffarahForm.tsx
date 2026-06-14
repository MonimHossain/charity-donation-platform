"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addDonationCartItem } from "@/lib/stores/donationCartStore";
import type { DonationExperienceFidyaKaffarah } from "@icac/shared-types";
import type { DonationSource } from "@/lib/donation-source";
import type { CheckoutSettings } from "@/components/campaigns/campaign-detail-types";
import type { CampaignUpsell } from "@/lib/checkout-campaign-config";

export default function FidyaKaffarahForm({
  source,
  experience,
  embedded = false,
  checkoutSettings,
  checkoutUpsells,
}: {
  source: DonationSource;
  experience: DonationExperienceFidyaKaffarah;
  embedded?: boolean;
  checkoutSettings?: CheckoutSettings;
  checkoutUpsells?: CampaignUpsell[];
}) {
  const router = useRouter();
  const options = experience.options ?? [];
  const initialKey = options[0]?.key ?? "fidya";
  const [selectedKey, setSelectedKey] = useState<string>(initialKey);
  const [qty, setQty] = useState<number>(experience.quantity?.default ?? experience.quantity?.min ?? 1);
  const [customAmount, setCustomAmount] = useState<string>("");

  const selected = options.find((o) => o.key === selectedKey) ?? options[0];
  const min = experience.quantity?.min ?? 1;
  const max = experience.quantity?.max ?? 9999;
  const unitPrice = Number(selected?.unitPrice ?? 0);
  const boundedQty = Math.max(min, Math.min(max, Number.isFinite(qty) ? qty : min));
  const computedTotal = boundedQty * unitPrice;
  const allowCustom = Boolean(experience.allowCustomAmount);
  const customMin = Number(experience.customAmount?.min ?? 1);
  const customMax = Number(experience.customAmount?.max ?? 100000);
  const customTotal = customAmount ? Number(customAmount) : NaN;
  const total =
    allowCustom && Number.isFinite(customTotal)
      ? Math.max(customMin, Math.min(customMax, customTotal))
      : computedTotal;
  const currency = (source.currency ?? "GBP").toUpperCase();

  return (
    <div className={cn("space-y-5", embedded ? "" : "rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-soft")}>
      <div className="rounded-full border border-primary/30 bg-secondary p-1 flex">
        {options.map((opt) => {
          const active = opt.key === selectedKey;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelectedKey(opt.key)}
              className={cn(
                "flex-1 py-3 rounded-full text-sm font-semibold transition-colors",
                active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-full bg-accent text-accent-foreground text-center py-4 text-2xl font-bold tabular-nums">
        £ {Number.isFinite(total) ? total.toFixed(0) : "0"}
      </div>

      <div className="flex items-center gap-3">
        <p className="font-semibold text-foreground min-w-[90px]">{experience.quantity?.label ?? "Quantity:"}</p>
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="rounded-full h-12 text-center"
        />
      </div>

      {allowCustom && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">
            {experience.customAmount?.label ?? "Custom amount"}
          </p>
          <Input
            type="number"
            inputMode="numeric"
            min={customMin}
            max={customMax}
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder={String(experience.customAmount?.placeholder ?? "Enter amount")}
            className="rounded-xl h-11"
          />
          <p className="text-xs text-muted-foreground">If filled, this overrides the calculated total.</p>
        </div>
      )}

      <Button
        size="lg"
        className="w-full rounded-full bg-accent hover:bg-primary hover:text-primary-foreground h-14 text-base"
        disabled={!Number.isFinite(total) || total <= 0}
        onClick={() => {
          const label = selected?.label ?? selectedKey;
          addDonationCartItem({
            kind: "fidya_kaffarah",
            donationPageId: source.id,
            donationPageSlug: source.slug,
            title: source.title,
            category: source.category,
            amount: total,
            currency,
            quantity: boundedQty,
            unitPrice: allowCustom && Number.isFinite(customTotal) ? total / boundedQty : unitPrice,
            description: `${label} × ${boundedQty} — £${total.toFixed(2)}`,
            campaignId: source.campaignId ?? source.id,
            donationType: selectedKey,
            checkoutSettings,
            checkoutUpsells,
            fidya: { optionKey: selectedKey, optionLabel: label },
          });
          toast.success("Added to cart");
          router.push("/donation/checkout");
        }}
      >
        Add to cart
      </Button>
    </div>
  );
}

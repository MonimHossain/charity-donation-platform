"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuickDonateConfig } from "@/lib/data/cms";
import type { QuickDonateOption } from "@/lib/quick-donate";
import { defaultQuickDonateAmount } from "@/lib/quick-donate";
import { getCurrencyCode } from "@/lib/currency";

export type QuickDonateFrequency = "single" | "monthly";

export function useQuickDonateForm(initialCampaignSlug?: string) {
  const router = useRouter();
  const { data: config, isLoading } = useQuickDonateConfig();
  const options = config?.options ?? [];
  const categories = config?.settings.donationCategories ?? [];
  const showSingle = config?.settings.showSingleFrequency ?? true;
  const showRegular = config?.settings.showRegularFrequency ?? true;

  const initialOption = useMemo(() => {
    if (!options.length) return null;
    if (initialCampaignSlug) {
      const match = options.find(
        (o) => o.campaignSlug === initialCampaignSlug || o.id === initialCampaignSlug
      );
      if (match) return match;
    }
    return options[0];
  }, [options, initialCampaignSlug]);

  const [selectedOptionId, setSelectedOptionId] = useState<string>("");
  const [category, setCategory] = useState("");
  const [freq, setFreq] = useState<QuickDonateFrequency>("single");
  const [amount, setAmount] = useState(50);
  const [custom, setCustom] = useState("");

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialOption || initialized) return;
    setSelectedOptionId(initialOption.id);
    setAmount(defaultQuickDonateAmount(initialOption.prices));
    setCustom("");
    setInitialized(true);
  }, [initialOption, initialized]);

  useEffect(() => {
    if (categories.length && !category) {
      setCategory(categories[0].value);
    }
  }, [categories, category]);

  const selectedOption: QuickDonateOption | null =
    options.find((o) => o.id === selectedOptionId) ?? options[0] ?? null;

  const prices = selectedOption?.prices ?? [];
  const finalAmount = Number(custom) || amount;

  const selectOption = (optionId: string) => {
    setSelectedOptionId(optionId);
    const option = options.find((o) => o.id === optionId);
    const defaultAmount = option?.prices?.length
      ? defaultQuickDonateAmount(option.prices)
      : undefined;
    if (defaultAmount) {
      setAmount(defaultAmount);
      setCustom("");
    }
  };

  const selectAmount = (value: number) => {
    setAmount(value);
    setCustom("");
  };

  const goToDonate = () => {
    if (!selectedOption) return;
    const cause = selectedOption.campaignSlug || selectedOption.label.toLowerCase().replace(/\s+/g, "-");
    const params = new URLSearchParams({
      amount: String(finalAmount),
      freq,
      cause,
      category,
      source: "quick",
      label: selectedOption.label,
      currency: getCurrencyCode(),
    });
    if (selectedOption.campaignId) {
      params.set("campaign", selectedOption.campaignId);
    }
    router.push(`/donate?${params.toString()}`);
  };

  return {
    isLoading,
    options,
    categories,
    showSingle,
    showRegular,
    selectedOptionId,
    selectedOption,
    category,
    freq,
    amount,
    custom,
    prices,
    finalAmount,
    setCategory,
    setFreq,
    setCustom,
    setAmount,
    selectOption,
    selectAmount,
    goToDonate,
  };
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuickDonateConfig } from "@/lib/data/cms";
import type { QuickDonateOption } from "@/lib/quick-donate";
import { defaultQuickDonateAmount } from "@/lib/quick-donate";
import {
  defaultAmountForAttribute,
  getQuickDonatePaymentConfig,
  getQuickDonatePaymentType,
  getQuickDonatePresets,
  normalizeQuickDonateCampaign,
  quickDonateAllowsCustomAmount,
  quickDonateShowsPresets,
  quickDonateStartsWithCustomInput,
} from "@/lib/quick-donate-campaign";
import { convertAmount, getCurrencyCode, useCurrency } from "@/lib/currency";

export type QuickDonateFrequency = "single" | "monthly";

export type QuickDonateDisplayPrice = {
  amount: number;
  sortOrder: number;
  description?: string;
  sourceAmount: number;
  displayAmount: number;
};

function normalizeOption(option: QuickDonateOption): QuickDonateOption | null {
  const campaign = normalizeQuickDonateCampaign(
    option.campaign as Record<string, unknown> | null | undefined
  );
  if (!option.campaignId || !campaign || campaign.attributes.length === 0) return null;
  return { ...option, campaign };
}

export function useQuickDonateForm(initialCampaignSlug?: string) {
  const router = useRouter();
  const { code: displayCurrency } = useCurrency();
  const { data: config, isLoading } = useQuickDonateConfig();

  const options = useMemo(
    () =>
      (config?.options ?? [])
        .map((o) => normalizeOption(o))
        .filter((o): o is QuickDonateOption => Boolean(o)),
    [config?.options]
  );

  const categories = config?.settings.donationCategories ?? [];

  const initialOption = useMemo(() => {
    if (!options.length) return null;
    if (initialCampaignSlug) {
      const match = options.find(
        (o) =>
          o.campaignSlug === initialCampaignSlug ||
          o.campaign?.slug === initialCampaignSlug ||
          o.id === initialCampaignSlug
      );
      if (match) return match;
    }
    return options[0];
  }, [options, initialCampaignSlug]);

  const [selectedOptionId, setSelectedOptionId] = useState("");
  const [selectedAttrIdx, setSelectedAttrIdx] = useState(0);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedPresetDescription, setSelectedPresetDescription] = useState("");
  const [custom, setCustom] = useState("");
  const [customAmountActive, setCustomAmountActive] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const selectedOption: QuickDonateOption | null =
    options.find((o) => o.id === selectedOptionId) ?? options[0] ?? null;

  const selectedCampaign = selectedOption?.campaign ?? null;
  const attributes = selectedCampaign?.attributes ?? [];
  const selectedAttr = attributes[selectedAttrIdx];
  const sourceCurrency = selectedCampaign?.currency ?? "GBP";

  const paymentType = getQuickDonatePaymentType(selectedAttr);
  const paymentConfig = getQuickDonatePaymentConfig(selectedAttr, paymentType);
  const freq: QuickDonateFrequency = paymentType === "regular" ? "monthly" : "single";
  const presets = getQuickDonatePresets(selectedAttr, paymentType);
  const showPresets = quickDonateShowsPresets(paymentConfig);
  const showCustomAmount = quickDonateAllowsCustomAmount(paymentConfig);

  const applySelectionDefaults = (option: QuickDonateOption, attrIdx = 0) => {
    const campaign = option.campaign;
    const attr = campaign?.attributes[attrIdx];
    const type = getQuickDonatePaymentType(attr);
    const config = getQuickDonatePaymentConfig(attr, type);
    const nextPresets = getQuickDonatePresets(attr, type);
    const defaultAmount = defaultAmountForAttribute(attr, type);
    const defaultDescription =
      nextPresets.find((p) => p.amount === defaultAmount)?.description ?? "";

    setSelectedOptionId(option.id);
    setSelectedAttrIdx(attrIdx);

    if (quickDonateStartsWithCustomInput(config)) {
      setAmount(0);
      setSelectedPresetDescription("");
      setCustom("");
      setCustomAmountActive(true);
      return;
    }

    if (defaultAmount > 0) {
      setAmount(defaultAmount);
      setSelectedPresetDescription(defaultDescription);
      setCustom("");
      setCustomAmountActive(false);
    } else if (nextPresets.length) {
      const fallback = defaultQuickDonateAmount(
        nextPresets.map((p, i) => ({ amount: p.amount, sortOrder: i }))
      );
      setAmount(fallback);
      setSelectedPresetDescription(
        nextPresets.find((p) => p.amount === fallback)?.description ?? ""
      );
      setCustom("");
      setCustomAmountActive(false);
    } else {
      setAmount(0);
      setSelectedPresetDescription("");
      setCustom("");
      setCustomAmountActive(false);
    }
  };

  useEffect(() => {
    if (!initialOption || initialized) return;
    applySelectionDefaults(initialOption, 0);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOption, initialized]);

  useEffect(() => {
    const first = categories[0];
    if (first && !category) {
      setCategory(first.value);
    }
  }, [categories, category]);

  const displayPrices: QuickDonateDisplayPrice[] = useMemo(
    () =>
      presets.map((p, index) => ({
        amount: p.amount,
        sortOrder: index,
        description: p.description,
        sourceAmount: p.amount,
        displayAmount: convertAmount(p.amount, sourceCurrency, displayCurrency),
      })),
    [presets, sourceCurrency, displayCurrency]
  );

  const displayAmount = convertAmount(amount, sourceCurrency, displayCurrency);
  const finalAmount = customAmountActive
    ? Number(custom) > 0
      ? Number(custom)
      : displayAmount
    : displayAmount;

  const selectOption = (optionId: string) => {
    const option = options.find((o) => o.id === optionId);
    if (!option) return;
    applySelectionDefaults(option, 0);
  };

  const selectAttribute = (attrIdx: number) => {
    if (!selectedOption) return;
    applySelectionDefaults(selectedOption, attrIdx);
  };

  const selectAmount = (sourceValue: number, description?: string) => {
    setAmount(sourceValue);
    setSelectedPresetDescription(description?.trim() ?? "");
    setCustom("");
    setCustomAmountActive(false);
  };

  const openCustomInput = () => {
    setCustomAmountActive(true);
    setAmount(0);
    setSelectedPresetDescription("");
  };

  const updateCustomAmount = (value: string) => {
    setCustomAmountActive(true);
    setCustom(value);
    setSelectedPresetDescription("");
  };

  const goToDonate = () => {
    if (!selectedOption?.campaign) return;
    const cause =
      selectedOption.campaignSlug ||
      selectedOption.campaign.slug ||
      selectedOption.label.toLowerCase().replace(/\s+/g, "-");

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
    if (selectedOption.campaignSlug) {
      params.set("campaignSlug", selectedOption.campaignSlug);
    }
    if (selectedAttr?.id) {
      params.set("attributeId", selectedAttr.id);
    }
    if (selectedAttr?.name) {
      params.set("attributeName", selectedAttr.name);
    }

    router.push(`/donate?${params.toString()}`);
  };

  return {
    isLoading,
    options,
    categories,
    selectedOptionId,
    selectedOption,
    selectedCampaign,
    attributes,
    selectedAttrIdx,
    selectedAttr,
    category,
    freq,
    paymentType,
    amount,
    custom,
    customAmountActive,
    selectedPresetDescription,
    showPresets,
    showCustomAmount,
    displayPrices,
    displayAmount,
    finalAmount,
    sourceCurrency,
    setCategory,
    selectOption,
    selectAttribute,
    selectAmount,
    openCustomInput,
    updateCustomAmount,
    goToDonate,
  };
}

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
  isQuickDonateRamadanCampaign,
  normalizeQuickDonateCampaign,
  quickDonateAllowsCustomAmount,
  quickDonateHasRamadanConfig,
  quickDonateShowsPresets,
  quickDonateStartsWithCustomInput,
} from "@/lib/quick-donate-campaign";
import { DEFAULT_RAMADAN_CONFIG, type RamadanSplitConfig } from "@/lib/campaign-experience";
import { campaignToDonationSource } from "@/lib/donation-source";
import { convertAmount, getCurrencyCode, useCurrency } from "@/lib/currency";
import {
  buildEqualRamadanNightPreview,
  buildRamadanCalendarDates,
  buildRecurringDonationPlan,
  getRamadanAdminConfig,
  getRamadanPresetDates,
} from "@/lib/ramadan-split";
import { useRamadanRegion, ramadanRegionLabel } from "@/lib/ramadan-region";
import { clearDonationCart, addDonationCartItem } from "@/lib/stores/donationCartStore";
import type { QuickDonateGivingOption } from "@/components/home/QuickDonateRamadanSection";

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
  if (!option.campaignId || !campaign) return null;

  if (isQuickDonateRamadanCampaign(campaign)) {
    const hasAttrs = campaign.attributes.length > 0;
    const hasRamadan = quickDonateHasRamadanConfig(campaign);
    if (!hasAttrs && !hasRamadan) return null;
    return { ...option, campaign };
  }

  if (campaign.attributes.length === 0) return null;
  return { ...option, campaign };
}

export function useQuickDonateForm(initialCampaignSlug?: string) {
  const router = useRouter();
  const { code: displayCurrency, formatFromSource } = useCurrency();
  const { regionId } = useRamadanRegion();
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
  const [ramadanGivingOption, setRamadanGivingOption] = useState<QuickDonateGivingOption>("odd_5");
  const [ramadanSelectedDates, setRamadanSelectedDates] = useState<string[]>([]);

  const selectedOption: QuickDonateOption | null =
    options.find((o) => o.id === selectedOptionId) ?? options[0] ?? null;

  const selectedCampaign = selectedOption?.campaign ?? null;
  const attributes = selectedCampaign?.attributes ?? [];
  const selectedAttr = attributes[selectedAttrIdx];
  const sourceCurrency = selectedCampaign?.currency ?? "GBP";
  const isRamadanSplit = isQuickDonateRamadanCampaign(selectedCampaign);
  const showRamadanSection = isRamadanSplit && quickDonateHasRamadanConfig(selectedCampaign);

  const ramadanExperience = useMemo(() => {
    if (!selectedCampaign || !isRamadanSplit) return null;
    const config = {
      ...DEFAULT_RAMADAN_CONFIG,
      ...(selectedCampaign.experienceConfig as RamadanSplitConfig),
    };
    return {
      type: "ramadan_split" as const,
      ...config,
      campaignId: selectedCampaign.id,
      currency: selectedCampaign.currency,
    };
  }, [selectedCampaign, isRamadanSplit]);

  const ramadanCalendarDates = useMemo(() => {
    if (!ramadanExperience) return [];
    const { ramadanStartDate, maxNights } = getRamadanAdminConfig(ramadanExperience, regionId);
    return buildRamadanCalendarDates(ramadanStartDate, maxNights);
  }, [ramadanExperience, regionId]);

  const ramadanSelectedOrdered = useMemo(
    () => ramadanCalendarDates.filter((d) => ramadanSelectedDates.includes(d)),
    [ramadanCalendarDates, ramadanSelectedDates]
  );

  useEffect(() => {
    if (!showRamadanSection || !ramadanCalendarDates.length) return;
    setRamadanGivingOption("odd_5");
    setRamadanSelectedDates(getRamadanPresetDates("odd_5", ramadanCalendarDates));
  }, [selectedCampaign?.id, showRamadanSection]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!showRamadanSection || ramadanGivingOption === "custom") return;
    setRamadanSelectedDates(getRamadanPresetDates(ramadanGivingOption, ramadanCalendarDates));
  }, [ramadanCalendarDates, ramadanGivingOption, regionId, showRamadanSection]);

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
    const attrConfig = getQuickDonatePaymentConfig(attr, type);
    const nextPresets = getQuickDonatePresets(attr, type);
    const defaultAmount = defaultAmountForAttribute(attr, type);
    const defaultDescription =
      nextPresets.find((p) => p.amount === defaultAmount)?.description ?? "";

    setSelectedOptionId(option.id);
    setSelectedAttrIdx(attrIdx);

    if (quickDonateStartsWithCustomInput(attrConfig)) {
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

    if (isRamadanSplit && showRamadanSection && ramadanExperience && selectedCampaign) {
      const campaign = selectedCampaign;
      const baseTotal = finalAmount;
      const nightPreview = buildEqualRamadanNightPreview(ramadanSelectedOrdered, baseTotal);
      if (
        ramadanSelectedOrdered.length === 0 ||
        !Number.isFinite(baseTotal) ||
        baseTotal <= 0 ||
        nightPreview.some((n) => n.amount < 0)
      ) {
        return;
      }

      const { ramadanStartDate } = getRamadanAdminConfig(ramadanExperience, regionId);
      const source = campaignToDonationSource({
        id: campaign.id,
        slug: campaign.slug,
        title: campaign.title,
        category: campaign.category || "general",
        currency: sourceCurrency,
      });
      const recurringPlan = buildRecurringDonationPlan({
        donationPageId: source.id,
        donationPageSlug: source.slug,
        campaignId: campaign.id,
        currency: sourceCurrency,
        totalAmount: baseTotal,
        nights: nightPreview,
      });
      const dailyBreakdown = nightPreview.map((n) => n.amount);

      clearDonationCart();
      addDonationCartItem({
        kind: "ramadan_split",
        donationPageId: source.id,
        donationPageSlug: source.slug,
        title: selectedOption.label || campaign.title,
        category: category || campaign.category || "general",
        amount: baseTotal,
        currency: sourceCurrency,
        description: `Ramadan split — ${ramadanSelectedOrdered.length} nights — ${formatFromSource(nightPreview[0]?.amount ?? 0, sourceCurrency)}/night`,
        campaignId: campaign.id,
        donationType: "ramadan",
        ramadan: {
          ramadanStartDate,
          regionId,
          regionLabel: ramadanRegionLabel(regionId),
          selectedDates: ramadanSelectedOrdered,
          weights: ramadanSelectedOrdered.map(() => 1),
          dailyBreakdown,
          nights: ramadanSelectedOrdered.length,
          campaignId: campaign.id,
          notes: `Ramadan split (${ramadanSelectedOrdered.length} nights)`,
          recurringPlan,
        },
      });
      router.push("/donation/checkout");
      return;
    }

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
    isRamadanSplit,
    showRamadanSection,
    ramadanGivingOption,
    ramadanSelectedDates,
    setRamadanGivingOption,
    setRamadanSelectedDates,
    setCategory,
    selectOption,
    selectAttribute,
    selectAmount,
    openCustomInput,
    updateCustomAmount,
    goToDonate,
  };
}

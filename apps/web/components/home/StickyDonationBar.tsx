"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickDonateForm } from "@/lib/hooks/useQuickDonateForm";
import { useCurrency } from "@/lib/currency";
import { QuickDonateAttributePills } from "@/components/home/QuickDonateAttributePills";
import { QuickDonatePricePicker } from "@/components/home/QuickDonatePricePicker";
import { QuickDonateRamadanSection } from "@/components/home/QuickDonateRamadanSection";

const HIDE_ON = ["/donate", "/donation/checkout"];
const HIDE_PREFIXES = ["/donation/"];

const IMPACT: Record<number, string> = {
  10: "Feeds a family for a day",
  20: "Emergency food parcel",
  25: "Emergency food parcel",
  40: "Clean water for a family",
  50: "Clean water for 25 people",
  100: "1 month of orphan support",
};

const StickyDonationBar = () => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const { symbol } = useCurrency();

  const {
    options,
    categories,
    selectedOptionId,
    category,
    freq,
    amount,
    custom,
    customAmountActive,
    selectedPresetDescription,
    showPresets,
    showCustomAmount,
    displayPrices,
    finalAmount,
    sourceCurrency,
    attributes,
    selectedAttrIdx,
    selectedCampaign,
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
  } = useQuickDonateForm();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDE_ON.includes(pathname)) return null;
  if (HIDE_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (!visible) return null;

  const showAttributePills = attributes.length >= 1;
  const showPricePicker = showPresets || showCustomAmount;
  const impactText =
    selectedPresetDescription.trim() ||
    IMPACT[finalAmount] ||
    "Your gift makes an immediate difference";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl sm:max-w-xl m-2 sm:m-3 rounded-2xl bg-primary text-primary-foreground shadow-lift border border-primary-foreground/10 backdrop-blur">
        {open && (
          <div className="px-4 pt-4 pb-2 animate-fade-up space-y-3">
            {showAttributePills && (
              <QuickDonateAttributePills
                attributes={attributes}
                selectedIndex={selectedAttrIdx}
                onSelect={selectAttribute}
                dark
                showWhenSingle
              />
            )}

            <select
              value={selectedOptionId}
              onChange={(e) => selectOption(e.target.value)}
              className="w-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-semibold rounded-xl px-3 py-2.5 border border-primary-foreground/15 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              aria-label="Choose a cause"
            >
              {options.map((c) => (
                <option key={c.id} value={c.id} className="text-foreground">
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-semibold rounded-xl px-3 py-2.5 border border-primary-foreground/15 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
              aria-label="Donation category"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value} className="text-foreground">
                  {c.label}
                </option>
              ))}
            </select>

            {showPricePicker && (
              <QuickDonatePricePicker
                sourceCurrency={sourceCurrency}
                displayPrices={displayPrices}
                showPresets={showPresets}
                showCustomAmount={showCustomAmount}
                amount={amount}
                custom={custom}
                customAmountActive={customAmountActive}
                selectedPresetDescription={selectedPresetDescription}
                onSelectAmount={selectAmount}
                onOpenCustom={openCustomInput}
                onUpdateCustom={updateCustomAmount}
                dark
                compact
              />
            )}

            {showRamadanSection && selectedCampaign && (
              <QuickDonateRamadanSection
                campaign={selectedCampaign}
                givingOption={ramadanGivingOption}
                selectedDates={ramadanSelectedDates}
                onGivingOptionChange={setRamadanGivingOption}
                onSelectedDatesChange={setRamadanSelectedDates}
                compact
                dark
              />
            )}

            <p className="text-[11px] text-center text-primary-foreground/75">{impactText}</p>
          </div>
        )}

        <div className="flex items-stretch gap-2 p-1.5 sm:p-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 text-xs sm:text-sm font-semibold"
            aria-label="Choose amount"
          >
            <span className="font-bold">{symbol}{finalAmount}</span>
            {freq === "monthly" && <span className="text-[10px] opacity-80">/mo</span>}
            {open ? <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <Button
            onClick={goToDonate}
            className="flex-1 rounded-xl text-sm sm:text-base font-bold h-10 sm:h-11 bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground"
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" /> Donate Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyDonationBar;

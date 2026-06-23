"use client";

import { ShieldCheck, ChevronDown, HandHeart, CircleDollarSign, Tag } from "lucide-react";
import { homeDonateButtonClass } from "@/lib/home-buttons";
import { useQuickDonateForm } from "@/lib/hooks/useQuickDonateForm";
import { useCurrency } from "@/lib/currency";
import { QuickDonateAttributePills } from "@/components/home/QuickDonateAttributePills";
import { QuickDonatePricePicker } from "@/components/home/QuickDonatePricePicker";

interface Props {
  defaultAmount?: number;
  campaign?: string;
  variant?: "light" | "dark" | "banner";
}

export default function QuickDonate({ campaign = "gaza", variant = "light" }: Props) {
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
    setCategory,
    selectOption,
    selectAttribute,
    selectAmount,
    openCustomInput,
    updateCustomAmount,
    goToDonate,
  } = useQuickDonateForm(campaign);

  const { symbol } = useCurrency();
  const showAttributePills = attributes.length > 1;
  const showPricePicker = showPresets || showCustomAmount;

  if (variant === "banner") {
    const LabeledField = ({
      label,
      icon: Icon,
      children,
    }: {
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      children: React.ReactNode;
    }) => (
      <div className="flex flex-col gap-1 min-w-0">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
          <Icon className="w-3 h-3 text-accent-deep" />
          {label}
        </span>
        {children}
      </div>
    );

    const fieldClass =
      "w-full appearance-none bg-secondary/60 hover:bg-secondary text-foreground font-semibold text-sm rounded-xl px-3 pr-8 h-11 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate";

    return (
      <div className="bg-card/95 backdrop-blur rounded-3xl shadow-lift border border-border p-3 sm:p-4 max-w-2xl">
        <div className="flex items-center justify-between gap-3 mb-3">
            {showAttributePills ? (
              <div className="flex-1 min-w-0">
                <QuickDonateAttributePills
                  attributes={attributes}
                  selectedIndex={selectedAttrIdx}
                  onSelect={selectAttribute}
                />
              </div>
            ) : (
              <span className="flex-1" aria-hidden />
            )}
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-deep" /> Secure checkout
            </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledField label="I'd like to donate to" icon={HandHeart}>
            <div className="relative">
              <select
                value={selectedOptionId}
                onChange={(e) => selectOption(e.target.value)}
                className={fieldClass}
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </LabeledField>

          <LabeledField label="Donation category" icon={Tag}>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={fieldClass}
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
          </LabeledField>
        </div>

        {showPricePicker && (
          <div className="mt-3">
            <LabeledField label="Amount" icon={CircleDollarSign}>
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
                compact
              />
            </LabeledField>
          </div>
        )}

        <button
          type="button"
          onClick={goToDonate}
          className={`w-full h-12 mt-3 text-base font-bold ${homeDonateButtonClass}`}
        >
          Donate {symbol}{finalAmount}{freq === "monthly" ? "/mo" : ""}
        </button>

        <p className="sm:hidden mt-2 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-accent-deep" /> Secure checkout
        </p>
      </div>
    );
  }

  const dark = variant === "dark";

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 shadow-lift border ${
        dark
          ? "bg-primary/95 backdrop-blur text-primary-foreground border-primary-foreground/15"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className={`text-xs uppercase tracking-widest font-semibold ${dark ? "text-accent" : "text-accent-deep"}`}>
          Donate in seconds
        </p>
        {showAttributePills && (
          <div className="flex-1 min-w-0 max-w-[220px] sm:max-w-xs">
            <QuickDonateAttributePills
              attributes={attributes}
              selectedIndex={selectedAttrIdx}
              onSelect={selectAttribute}
              dark={dark}
            />
          </div>
        )}
      </div>

      <div className="mb-3 relative">
        <select
          value={selectedOptionId}
          onChange={(e) => selectOption(e.target.value)}
          className="w-full appearance-none bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-xs rounded-full pl-3 pr-7 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>Cause: {o.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

      <div className="mb-3 relative">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full appearance-none bg-secondary/70 hover:bg-secondary text-foreground font-semibold text-xs rounded-full pl-3 pr-7 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer truncate"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>Category: {c.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>

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
          dark={dark}
        />
      )}

      <button
        type="button"
        onClick={goToDonate}
        className={`w-full mt-4 h-12 text-base font-bold ${homeDonateButtonClass}`}
      >
        Donate {symbol}{finalAmount}
        {freq === "monthly" && "/mo"}
      </button>

      <div className={`mt-3 flex items-center justify-center gap-1.5 text-[11px] ${dark ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
        <ShieldCheck className="w-3.5 h-3.5" /> Secure · Apple Pay · Google Pay · Card
      </div>
    </div>
  );
}

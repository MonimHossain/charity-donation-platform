"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Heart, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuickDonateForm } from "@/lib/hooks/useQuickDonateForm";

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
  const symbol = "£";

  const {
    options,
    categories,
    showSingle,
    showRegular,
    selectedOptionId,
    category,
    freq,
    amount,
    prices,
    finalAmount,
    setCategory,
    setFreq,
    selectOption,
    selectAmount,
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

  const frequencies = (
    [
      showSingle ? ("single" as const) : null,
      showRegular ? ("monthly" as const) : null,
    ].filter(Boolean) as Array<"single" | "monthly">
  );

  const currentImpact = IMPACT[amount] ?? "Your gift makes an immediate difference";
  const presetAmounts = prices.length > 0 ? prices.map((p) => p.amount) : [10, 25, 50, 100];

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl sm:max-w-xl m-2 sm:m-3 rounded-2xl bg-primary text-primary-foreground shadow-lift border border-primary-foreground/10 backdrop-blur">
        {open && (
          <div className="px-4 pt-4 pb-2 animate-fade-up space-y-3">
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

            <div className="grid grid-cols-2 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-xs font-semibold rounded-xl px-3 py-2.5 border border-primary-foreground/15 focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer"
                aria-label="Donation category"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value} className="text-foreground">
                    {c.label}
                  </option>
                ))}
              </select>
              {frequencies.length > 0 && (
                <div className="flex p-0.5 rounded-xl bg-primary-foreground/10">
                  {frequencies.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFreq(f)}
                      className={`flex-1 text-xs font-semibold rounded-lg py-2 transition-colors ${
                        freq === f
                          ? "bg-accent text-accent-foreground"
                          : "text-primary-foreground/70 hover:text-primary-foreground"
                      }`}
                    >
                      {f === "single" ? "Single" : "Monthly"}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`grid gap-2 ${presetAmounts.length <= 4 ? "grid-cols-4" : "grid-cols-5"}`}>
              {presetAmounts.map((p) => (
                <button
                  key={p}
                  onClick={() => selectAmount(p)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    amount === p
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                  }`}
                >
                  {symbol}{p}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-center text-primary-foreground/75">{currentImpact}</p>
          </div>
        )}

        <div className="flex items-stretch gap-2 p-1.5 sm:p-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 rounded-xl bg-primary-foreground/10 hover:bg-primary-foreground/20 text-xs sm:text-sm font-semibold"
            aria-label="Choose amount"
          >
            <span className="font-bold">{symbol}{finalAmount}</span>
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

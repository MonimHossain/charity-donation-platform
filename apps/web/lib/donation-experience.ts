import type { DonationExperienceType } from "@icac/shared-types";
import type { LucideIcon } from "lucide-react";
import { Calculator, Heart, Moon, Sparkles } from "lucide-react";

export interface ExperienceMeta {
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  badgeClass: string;
  chipClass: string;
}

export const EXPERIENCE_META: Record<DonationExperienceType, ExperienceMeta> = {
  standard: {
    label: "Standard",
    shortLabel: "Standard",
    description: "Universal donate flow with preset or custom amounts.",
    icon: Heart,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    chipClass: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  },
  fidya_kaffarah: {
    label: "Fidya / Kaffarah",
    shortLabel: "Fidya / Kaffarah",
    description: "Quantity-based options with unit pricing for Fidya and Kaffarah.",
    icon: Sparkles,
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
    chipClass: "bg-violet-100 text-violet-800 hover:bg-violet-200",
  },
  ramadan_split: {
    label: "Ramadan Split",
    shortLabel: "Ramadan Split",
    description: "Donors choose nights and weights across Ramadan.",
    icon: Moon,
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    chipClass: "bg-amber-100 text-amber-900 hover:bg-amber-200",
  },
  zakat_calc: {
    label: "Zakat Calculator",
    shortLabel: "Zakat Calc",
    description: "Guided zakat calculation and donation checkout.",
    icon: Calculator,
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    chipClass: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  },
};

export function getExperienceType(page: {
  config?: { experience?: { type?: string } };
}): DonationExperienceType {
  const type = page.config?.experience?.type;
  if (type && type in EXPERIENCE_META) return type as DonationExperienceType;
  return "standard";
}

export function getExperienceMeta(type: DonationExperienceType): ExperienceMeta {
  return EXPERIENCE_META[type] ?? EXPERIENCE_META.standard;
}

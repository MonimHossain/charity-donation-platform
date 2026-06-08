"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { RamadanStartChoice } from "@icac/shared-types";

export const RAMADAN_REGIONS = [
  { id: "middle_east", label: "Middle East & Gulf" },
  { id: "south_asia", label: "South Asia" },
  { id: "western", label: "UK, Europe & Americas" },
] as const;

export type RamadanRegionId = (typeof RAMADAN_REGIONS)[number]["id"];

const STORAGE_KEY = "ramadan-region";

const SOUTH_ASIA_TIMEZONES = new Set([
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Calcutta",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Kathmandu",
  "Asia/Thimphu",
]);

const MIDDLE_EAST_TIMEZONES = new Set([
  "Asia/Riyadh",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Qatar",
  "Asia/Muscat",
  "Asia/Dubai",
  "Asia/Aden",
  "Africa/Cairo",
  "Asia/Amman",
  "Asia/Beirut",
  "Asia/Damascus",
  "Asia/Baghdad",
  "Asia/Tehran",
  "Asia/Jerusalem",
  "Asia/Gaza",
  "Asia/Hebron",
  "Europe/Istanbul",
]);

const SOUTH_ASIA_LOCALES = new Set(["PK", "IN", "BD", "LK", "NP", "BT"]);
const MIDDLE_EAST_LOCALES = new Set([
  "SA",
  "AE",
  "OM",
  "QA",
  "BH",
  "KW",
  "YE",
  "EG",
  "JO",
  "LB",
  "SY",
  "IQ",
  "IR",
  "IL",
  "PS",
  "TR",
  "MA",
  "DZ",
  "TN",
  "LY",
  "SD",
]);

export type RamadanRegionSource = "preference" | "timezone" | "locale" | "default";

export function isRamadanRegionId(value: string): value is RamadanRegionId {
  return RAMADAN_REGIONS.some((r) => r.id === value);
}

export function ramadanRegionLabel(regionId: RamadanRegionId): string {
  return RAMADAN_REGIONS.find((r) => r.id === regionId)?.label ?? regionId;
}

function localeCountry(): string | null {
  if (typeof navigator === "undefined") return null;
  const lang = navigator.language || "";
  const parts = lang.split("-");
  if (parts.length >= 2) return parts[1]!.toUpperCase();
  return null;
}

export function detectRamadanRegion(): { regionId: RamadanRegionId; source: RamadanRegionSource } {
  if (typeof window === "undefined") {
    return { regionId: "western", source: "default" };
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isRamadanRegionId(saved)) {
    return { regionId: saved, source: "preference" };
  }

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (SOUTH_ASIA_TIMEZONES.has(tz)) {
    return { regionId: "south_asia", source: "timezone" };
  }
  if (MIDDLE_EAST_TIMEZONES.has(tz)) {
    return { regionId: "middle_east", source: "timezone" };
  }

  const country = localeCountry();
  if (country) {
    if (SOUTH_ASIA_LOCALES.has(country)) {
      return { regionId: "south_asia", source: "locale" };
    }
    if (MIDDLE_EAST_LOCALES.has(country)) {
      return { regionId: "middle_east", source: "locale" };
    }
  }

  return { regionId: "western", source: "timezone" };
}

export function setRamadanRegionPreference(regionId: RamadanRegionId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, regionId);
  window.dispatchEvent(new Event("ramadan-region-change"));
}

export function clearRamadanRegionPreference() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("ramadan-region-change"));
}

type RamadanRegionSnapshot = {
  regionId: RamadanRegionId;
  source: RamadanRegionSource;
};

const SERVER_SNAPSHOT: RamadanRegionSnapshot = {
  regionId: "western",
  source: "default",
};

let regionSnapshot: RamadanRegionSnapshot = SERVER_SNAPSHOT;

function refreshRamadanRegionSnapshot(): RamadanRegionSnapshot {
  const next = detectRamadanRegion();
  if (regionSnapshot.regionId === next.regionId && regionSnapshot.source === next.source) {
    return regionSnapshot;
  }
  regionSnapshot = next;
  return regionSnapshot;
}

export function getRamadanRegionSnapshot(): RamadanRegionSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  return refreshRamadanRegionSnapshot();
}

function subscribeRegion(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    refreshRamadanRegionSnapshot();
    onStoreChange();
  };
  window.addEventListener("ramadan-region-change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("ramadan-region-change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useRamadanRegion() {
  const detected = useSyncExternalStore(
    subscribeRegion,
    getRamadanRegionSnapshot,
    () => SERVER_SNAPSHOT
  );

  const setRegionId = useCallback((regionId: RamadanRegionId) => {
    setRamadanRegionPreference(regionId);
  }, []);

  return useMemo(
    () => ({
      regionId: detected.regionId,
      regionLabel: ramadanRegionLabel(detected.regionId),
      source: detected.source,
      setRegionId,
    }),
    [detected.regionId, detected.source, setRegionId]
  );
}

export function buildDefaultRamadanStartChoices(fallbackDate?: string): RamadanStartChoice[] {
  const date = fallbackDate ?? new Date().toISOString().slice(0, 10);
  return RAMADAN_REGIONS.map((r) => ({
    id: r.id,
    label: r.label,
    date,
    region: r.id,
  }));
}

export function normalizeRamadanStartChoices(input?: {
  ramadanStartDate?: string;
  startChoices?: RamadanStartChoice[];
}): RamadanStartChoice[] {
  const fallback = input?.ramadanStartDate ?? new Date().toISOString().slice(0, 10);

  if (input?.startChoices?.length) {
    const byRegion = new Map<RamadanRegionId, RamadanStartChoice>();
    for (const choice of input.startChoices) {
      const region = (choice.region ?? choice.id) as RamadanRegionId;
      if (isRamadanRegionId(region)) {
        byRegion.set(region, { ...choice, id: region, region, label: choice.label || ramadanRegionLabel(region) });
      }
    }
    return RAMADAN_REGIONS.map((r) => {
      const existing = byRegion.get(r.id);
      return (
        existing ?? {
          id: r.id,
          label: r.label,
          date: fallback,
          region: r.id,
        }
      );
    });
  }

  return buildDefaultRamadanStartChoices(fallback);
}

export function resolveRamadanStartDate(
  input: { ramadanStartDate?: string; startChoices?: RamadanStartChoice[] },
  regionId: RamadanRegionId
): string {
  const choices = normalizeRamadanStartChoices(input);
  const match = choices.find((c) => (c.region ?? c.id) === regionId);
  return match?.date ?? input.ramadanStartDate ?? new Date().toISOString().slice(0, 10);
}

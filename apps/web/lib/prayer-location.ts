export type PrayerLocation = {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  label: string;
};

const STORAGE_KEY = "yif-prayer-location-v1";

export const DEFAULT_PRAYER_LOCATION: PrayerLocation = {
  city: "London",
  country: "United Kingdom",
  label: "London, United Kingdom",
};

export function readPrayerLocation(): PrayerLocation {
  if (typeof window === "undefined") return DEFAULT_PRAYER_LOCATION;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRAYER_LOCATION;
    const parsed = JSON.parse(raw) as PrayerLocation;
    if (!parsed?.label) return DEFAULT_PRAYER_LOCATION;
    return parsed;
  } catch {
    return DEFAULT_PRAYER_LOCATION;
  }
}

export function savePrayerLocation(location: PrayerLocation, options?: { silent?: boolean }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  if (!options?.silent) {
    window.dispatchEvent(new CustomEvent("prayer-location-changed", { detail: location }));
  }
}

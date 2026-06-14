import { resolvePublicClientIp } from "../../helper/clientIp.js";

const ALADHAN_BASE = "https://api.aladhan.com/v1";
/** ISNA method — matches Your Impact Foundation reference site */
const CALCULATION_METHOD = 2;
const CACHE_TTL_MS = 30 * 60 * 1000;

type CacheEntry = { expiresAt: number; payload: unknown };

const cache = new Map<string, CacheEntry>();

function cacheKey(parts: Record<string, string | number>) {
  return Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function readCache<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit || hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.payload as T;
}

function writeCache(key: string, payload: unknown) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload });
}

function todayDdMmYyyy(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function sanitizeLocationPart(value: unknown, maxLen = 80): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, maxLen);
  if (!trimmed || !/^[a-zA-Z0-9\s.,'()-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function parseCoordinates(lat: unknown, lng: unknown): { latitude: number; longitude: number } | null {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

type AladhanApiResponse = {
  data?: Record<string, unknown>;
};

async function fetchAladhan(url: string): Promise<AladhanApiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "CharityDonationPlatform/1.0" },
    });
    if (!res.ok) {
      throw new Error(`Aladhan responded with ${res.status}`);
    }
    return (await res.json()) as AladhanApiResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeTimings(raw: Record<string, string>) {
  const strip = (v: string) => v.replace(/\s*\(.*\)$/, "").trim();
  return {
    Fajr: strip(raw.Fajr ?? ""),
    Sunrise: strip(raw.Sunrise ?? ""),
    Dhuhr: strip(raw.Dhuhr ?? ""),
    Asr: strip(raw.Asr ?? ""),
    Maghrib: strip(raw.Maghrib ?? ""),
    Isha: strip(raw.Isha ?? ""),
  };
}

export type PrayerTimesPayload = {
  location: string;
  timezone: string | null;
  date: string;
  islamicDate: string | null;
  timings: ReturnType<typeof normalizeTimings>;
  method: string;
  coordinates?: { latitude: number; longitude: number };
};

function normalizePayload(
  data: Record<string, unknown>,
  locationLabel: string,
  coordinates?: { latitude: number; longitude: number }
): PrayerTimesPayload {
  const timings = normalizeTimings(
    ((data.timings as Record<string, string>) ?? {}) as Record<string, string>
  );
  const date = data.date as Record<string, unknown> | undefined;
  const hijri = date?.hijri as Record<string, unknown> | undefined;
  const hijriMonth = hijri?.month as Record<string, string> | undefined;
  const meta = data.meta as Record<string, unknown> | undefined;

  const islamicDate =
    hijri && hijriMonth
      ? `${hijri.day} ${hijriMonth.en} ${hijri.year}`
      : null;

  return {
    location: locationLabel,
    timezone: (meta?.timezone as string) || null,
    date: todayDdMmYyyy(),
    islamicDate,
    timings,
    method: "ISNA",
    ...(coordinates ? { coordinates } : {}),
  };
}

type IpApiResponse = {
  status: string;
  message?: string;
  country?: string;
  city?: string;
  lat?: number;
  lon?: number;
};

async function geolocateIp(ip: string) {
  const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,city,lat,lon`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const json = (await res.json()) as IpApiResponse;
    if (json.status !== "success" || json.lat == null || json.lon == null) return null;
    return {
      latitude: json.lat,
      longitude: json.lon,
      city: json.city,
      country: json.country,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getPrayerTimesNearIp(ip: string) {
  const key = cacheKey({ type: "ip", ip, date: todayDdMmYyyy() });
  const cached = readCache<PrayerTimesPayload>(key);
  if (cached) return cached;

  const geo = await geolocateIp(ip);
  if (!geo) {
    throw new Error("Could not detect your location from this network");
  }

  const label =
    [geo.city, geo.country].filter(Boolean).join(", ") ||
    `Lat ${geo.latitude.toFixed(4)}, Lng ${geo.longitude.toFixed(4)}`;

  const coordsPayload = await getPrayerTimesByCoordinates(geo.latitude, geo.longitude);
  const payload: PrayerTimesPayload = {
    ...coordsPayload,
    location: label,
  };
  writeCache(key, payload);
  return payload;
}

export async function getPrayerTimesByCity(city: string, country: string) {
  const key = cacheKey({ type: "city", city, country, date: todayDdMmYyyy() });
  const cached = readCache<ReturnType<typeof normalizePayload>>(key);
  if (cached) return cached;

  const url = `${ALADHAN_BASE}/timingsByCity/${todayDdMmYyyy()}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${CALCULATION_METHOD}`;
  const json = await fetchAladhan(url);
  const data = json?.data;
  if (!data?.timings) {
    throw new Error("Prayer times unavailable for this location");
  }

  const payload = normalizePayload(data, `${city}, ${country}`);
  writeCache(key, payload);
  return payload;
}

export async function getPrayerTimesByCoordinates(latitude: number, longitude: number) {
  const lat = latitude.toFixed(4);
  const lng = longitude.toFixed(4);
  const key = cacheKey({ type: "coords", lat, lng, date: todayDdMmYyyy() });
  const cached = readCache<ReturnType<typeof normalizePayload>>(key);
  if (cached) return cached;

  const url = `${ALADHAN_BASE}/timings/${todayDdMmYyyy()}?latitude=${latitude}&longitude=${longitude}&method=${CALCULATION_METHOD}`;
  const json = await fetchAladhan(url);
  const data = json?.data;
  if (!data?.timings) {
    throw new Error("Prayer times unavailable for this location");
  }

  const meta = data.meta as Record<string, unknown> | undefined;
  const label =
    [meta?.city, meta?.country].filter(Boolean).join(", ") ||
    `Lat ${lat}, Lng ${lng}`;

  const payload = normalizePayload(data, label, { latitude, longitude });
  writeCache(key, payload);
  return payload;
}

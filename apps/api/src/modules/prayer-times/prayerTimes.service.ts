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

type NominatimReverseResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
  };
};

/** Resolve coordinates to "City, Country" when Aladhan meta has no place name. */
async function reverseGeocodeLabel(latitude: number, longitude: number): Promise<string | null> {
  const latKey = latitude.toFixed(3);
  const lngKey = longitude.toFixed(3);
  const geoKey = cacheKey({ type: "geocode", lat: latKey, lng: lngKey });
  const cached = readCache<string>(geoKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "en");
    url.searchParams.set("zoom", "10");

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": "YourImpactFoundation/1.0 (namaz-times; +https://yourimpactdev.com/namaz-times)",
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as NominatimReverseResponse;
    const a = json.address;
    if (!a) return null;

    const place =
      a.city ||
      a.town ||
      a.village ||
      a.municipality ||
      a.county ||
      a.state_district ||
      a.state;
    const country = a.country;

    let label: string | null = null;
    if (place && country) label = `${place}, ${country}`;
    else if (country) label = country;
    else if (place) label = place;

    if (label) writeCache(geoKey, label);
    return label;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
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

function normalizePayload(data: Record<string, unknown>, locationLabel: string) {
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
  };
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
  const fromMeta = [meta?.city, meta?.country].filter(Boolean).join(", ");
  const fromGeocode = fromMeta ? null : await reverseGeocodeLabel(latitude, longitude);
  const label =
    fromMeta ||
    fromGeocode ||
    `Lat ${lat}, Lng ${lng}`;

  const payload = normalizePayload(data, label);
  writeCache(key, payload);
  return payload;
}

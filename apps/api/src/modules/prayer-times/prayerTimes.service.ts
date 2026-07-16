const ALADHAN_BASE = "https://api.aladhan.com/v1";
/** ISNA method — matches Your Impact Foundation reference site */
const CALCULATION_METHOD = 2;
/** Hanafi Asr (school=1) — matches namaz-times page copy / rakat notes */
const ASR_SCHOOL = 1;
const CACHE_TTL_MS = 30 * 60 * 1000;
const NOMINATIM_UA =
  "YourImpactFoundation/1.0 (namaz-times; +https://yourimpactdev.com/namaz-times)";

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

type NominatimSearchResult = {
  lat?: string;
  lon?: string;
  display_name?: string;
};

/** Common aliases Aladhan / users type that should map to a real country name. */
const COUNTRY_ALIASES: Record<string, string> = {
  england: "United Kingdom",
  scotland: "United Kingdom",
  wales: "United Kingdom",
  "northern ireland": "United Kingdom",
  uk: "United Kingdom",
  "u.k.": "United Kingdom",
  "u.k": "United Kingdom",
  gb: "United Kingdom",
  "great britain": "United Kingdom",
  britain: "United Kingdom",
  usa: "United States",
  us: "United States",
  "u.s.": "United States",
  "u.s.a.": "United States",
  america: "United States",
  uae: "United Arab Emirates",
  "u.a.e.": "United Arab Emirates",
};

export function normalizeCountryName(country: string): string {
  const key = country.trim().toLowerCase().replace(/\s+/g, " ");
  return COUNTRY_ALIASES[key] || country.trim();
}

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
        "User-Agent": NOMINATIM_UA,
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

type ForwardGeocode = {
  latitude: number;
  longitude: number;
  label: string;
};

/** Resolve "City, Country" to coordinates — Aladhan city lookup often returns bad lat/lng. */
async function forwardGeocode(city: string, country: string): Promise<ForwardGeocode | null> {
  const geoKey = cacheKey({ type: "forward", city, country });
  const cached = readCache<ForwardGeocode>(geoKey);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const query = `${city}, ${country}`;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("accept-language", "en");

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_UA,
      },
    });
    if (!res.ok) return null;

    const results = (await res.json()) as NominatimSearchResult[];
    const hit = results[0];
    const latitude = Number(hit?.lat);
    const longitude = Number(hit?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    const label = hit.display_name?.split(",").slice(0, 2).map((s) => s.trim()).join(", ")
      || `${city}, ${country}`;
    const payload = { latitude, longitude, label };
    writeCache(geoKey, payload);
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function todayDdMmYyyy(timeZone?: string | null): string {
  try {
    if (timeZone) {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).formatToParts(new Date());
      const dd = parts.find((p) => p.type === "day")?.value;
      const mm = parts.find((p) => p.type === "month")?.value;
      const yyyy = parts.find((p) => p.type === "year")?.value;
      if (dd && mm && yyyy) return `${dd}-${mm}-${yyyy}`;
    }
  } catch {
    /* fall through */
  }
  const d = new Date();
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
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
  const timezone = (meta?.timezone as string) || null;

  const islamicDate =
    hijri && hijriMonth
      ? `${hijri.day} ${hijriMonth.en} ${hijri.year}`
      : null;

  return {
    location: locationLabel,
    timezone,
    date: todayDdMmYyyy(timezone),
    islamicDate,
    timings,
    method: "ISNA (Hanafi Asr)",
  };
}

function aladhanQuerySuffix() {
  return `method=${CALCULATION_METHOD}&school=${ASR_SCHOOL}`;
}

export async function getPrayerTimesByCity(city: string, country: string) {
  const normalizedCountry = normalizeCountryName(country);
  const key = cacheKey({
    type: "city",
    city,
    country: normalizedCountry,
    date: todayDdMmYyyy(),
    school: ASR_SCHOOL,
  });
  const cached = readCache<ReturnType<typeof normalizePayload>>(key);
  if (cached) return cached;

  // Prefer Nominatim → coordinates. Aladhan timingsByCity often returns placeholder lat/lng.
  const geo = await forwardGeocode(city, normalizedCountry);
  if (geo) {
    const byCoords = await getPrayerTimesByCoordinates(geo.latitude, geo.longitude, {
      label: `${city}, ${normalizedCountry}`,
    });
    writeCache(key, byCoords);
    return byCoords;
  }

  const url = `${ALADHAN_BASE}/timingsByCity/${todayDdMmYyyy()}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(normalizedCountry)}&${aladhanQuerySuffix()}`;
  const json = await fetchAladhan(url);
  const data = json?.data;
  if (!data?.timings) {
    throw new Error("Prayer times unavailable for this location");
  }

  const payload = normalizePayload(data, `${city}, ${normalizedCountry}`);
  writeCache(key, payload);
  return payload;
}

export async function getPrayerTimesByCoordinates(
  latitude: number,
  longitude: number,
  options?: { label?: string }
) {
  const lat = latitude.toFixed(4);
  const lng = longitude.toFixed(4);
  const key = cacheKey({
    type: "coords",
    lat,
    lng,
    date: todayDdMmYyyy(),
    school: ASR_SCHOOL,
  });
  const cached = readCache<ReturnType<typeof normalizePayload>>(key);
  if (cached) {
    if (options?.label && cached.location !== options.label) {
      return { ...cached, location: options.label };
    }
    return cached;
  }

  const url = `${ALADHAN_BASE}/timings/${todayDdMmYyyy()}?latitude=${latitude}&longitude=${longitude}&${aladhanQuerySuffix()}`;
  const json = await fetchAladhan(url);
  const data = json?.data;
  if (!data?.timings) {
    throw new Error("Prayer times unavailable for this location");
  }

  const meta = data.meta as Record<string, unknown> | undefined;
  const fromMeta = [meta?.city, meta?.country].filter(Boolean).join(", ");
  const fromGeocode = options?.label || fromMeta ? null : await reverseGeocodeLabel(latitude, longitude);
  const label =
    options?.label ||
    fromMeta ||
    fromGeocode ||
    `Lat ${lat}, Lng ${lng}`;

  const payload = normalizePayload(data, label);
  writeCache(key, payload);
  return payload;
}

export type PrayerTimings = {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
};

export type PrayerTimesResponse = {
  location: string;
  timezone: string | null;
  date: string;
  islamicDate: string | null;
  timings: PrayerTimings;
  method: string;
};

export const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYER_ORDER)[number];

export const PRAYER_DETAILS: Record<
  PrayerName | "Sunrise",
  {
    arabic: string;
    description: string;
    rakats: string;
    rakatPills: Array<{ label: string; accent?: boolean }>;
  }
> = {
  Fajr: {
    arabic: "الفجر",
    description: "Pre-dawn prayer, performed before sunrise.",
    rakats: "2 Sunnah before · 2 Fard",
    rakatPills: [
      { label: "2 Sunnah before" },
      { label: "2 Fard", accent: true },
    ],
  },
  Sunrise: {
    arabic: "الشروق",
    description: "End of Fajr time. Optional Ishraq prayer (2 rak'ah) after sunrise.",
    rakats: "",
    rakatPills: [],
  },
  Dhuhr: {
    arabic: "الظهر",
    description: "Midday prayer after the sun passes its zenith.",
    rakats: "4 Sunnah before · 4 Fard · 2 Sunnah after",
    rakatPills: [
      { label: "4 Sunnah before" },
      { label: "4 Fard", accent: true },
      { label: "2 Sunnah after" },
    ],
  },
  Asr: {
    arabic: "العصر",
    description: "Late afternoon prayer.",
    rakats: "4 Sunnah before · 4 Fard",
    rakatPills: [
      { label: "4 Sunnah before" },
      { label: "4 Fard", accent: true },
    ],
  },
  Maghrib: {
    arabic: "المغرب",
    description: "Just after sunset.",
    rakats: "3 Fard · 2 Sunnah after",
    rakatPills: [
      { label: "3 Fard", accent: true },
      { label: "2 Sunnah after" },
    ],
  },
  Isha: {
    arabic: "العشاء",
    description: "Night prayer, after twilight has disappeared.",
    rakats: "4 Fard · 2 Sunnah after · 3 Witr",
    rakatPills: [
      { label: "4 Fard", accent: true },
      { label: "2 Sunnah after" },
      { label: "3 Witr" },
    ],
  },
};

export const DISPLAY_PRAYERS: Array<PrayerName | "Sunrise"> = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

function parseTimeToMinutes(time24: string): number | null {
  const match = time24.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Minutes since midnight in the prayer location timezone (falls back to local). */
export function getNowMinutesInTimeZone(timeZone?: string | null): number {
  const now = new Date();
  if (timeZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        hour: "numeric",
        minute: "numeric",
        hourCycle: "h23",
      }).formatToParts(now);
      const hour = Number(parts.find((p) => p.type === "hour")?.value ?? NaN);
      const minute = Number(parts.find((p) => p.type === "minute")?.value ?? NaN);
      if (Number.isFinite(hour) && Number.isFinite(minute)) {
        return hour * 60 + minute;
      }
    } catch {
      /* fall through */
    }
  }
  return now.getHours() * 60 + now.getMinutes();
}

export function formatPrayerTime12h(time24: string): string {
  const mins = parseTimeToMinutes(time24);
  if (mins === null) return time24;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function getNextPrayer(
  timings: PrayerTimings,
  timeZone?: string | null
): {
  name: PrayerName;
  time: string;
  time24: string;
  minutesUntil: number;
  countdownLabel: string;
} {
  const nowMins = getNowMinutesInTimeZone(timeZone);

  for (const name of PRAYER_ORDER) {
    const time24 = timings[name];
    const prayerMins = parseTimeToMinutes(time24);
    if (prayerMins !== null && prayerMins > nowMins) {
      const minutesUntil = prayerMins - nowMins;
      return {
        name,
        time: formatPrayerTime12h(time24),
        time24,
        minutesUntil,
        countdownLabel: formatCountdownLabel(minutesUntil),
      };
    }
  }

  const fajr = timings.Fajr;
  const fajrMins = parseTimeToMinutes(fajr) ?? 0;
  const minutesUntil = 24 * 60 - nowMins + fajrMins;
  return {
    name: "Fajr",
    time: formatPrayerTime12h(fajr),
    time24: fajr,
    minutesUntil,
    countdownLabel: formatCountdownLabel(minutesUntil),
  };
}

export function formatCountdownLabel(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `in ${h}h ${m}m`;
  return `in ${m}m`;
}

export function formatGregorianDateLine(date = new Date()): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatHijriDateLine(islamicDate: string | null | undefined): string {
  if (!islamicDate) return "";
  return `${islamicDate} AH`;
}

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

export function parseCityCountryInput(value: string): { city: string; country: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const commaIndex = trimmed.indexOf(",");
  if (commaIndex === -1) return null;
  const city = trimmed.slice(0, commaIndex).trim();
  const country = normalizeCountryName(trimmed.slice(commaIndex + 1));
  if (!city || !country) return null;
  return { city, country };
}

export function formatLocationQuery(loc: { city?: string; country?: string; label?: string }) {
  if (loc.city && loc.country) return `${loc.city}, ${loc.country}`;
  return loc.label || "";
}

export function getCurrentPrayer(
  timings: PrayerTimings,
  timeZone?: string | null
): PrayerName | null {
  const nowMins = getNowMinutesInTimeZone(timeZone);
  const ordered = PRAYER_ORDER.map((name) => ({
    name,
    mins: parseTimeToMinutes(timings[name]) ?? -1,
  })).filter((p) => p.mins >= 0);

  for (let i = ordered.length - 1; i >= 0; i--) {
    if (nowMins >= ordered[i].mins) return ordered[i].name;
  }
  return null;
}

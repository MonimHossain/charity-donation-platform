"use client";

import { useState, useEffect } from "react";
import { Loader2, Navigation, Clock, Search } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePrayerTimes } from "@/lib/hooks/usePrayerTimes";
import { DEFAULT_PRAYER_LOCATION } from "@/lib/prayer-location";
import {
  DISPLAY_PRAYERS,
  PRAYER_DETAILS,
  formatPrayerTime12h,
  formatGregorianDateLine,
  formatHijriDateLine,
  parseCityCountryInput,
  formatLocationQuery,
  type PrayerName,
} from "@/lib/prayer-times";

export default function NamazTimesPage() {
  const {
    location,
    data,
    loading,
    error,
    currentPrayer,
    nextPrayer,
    updateLocation,
    reload,
  } = usePrayerTimes();
  const [locationQuery, setLocationQuery] = useState(
    formatLocationQuery(location) || formatLocationQuery(DEFAULT_PRAYER_LOCATION)
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setLocationQuery(formatLocationQuery(location));
  }, [location]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseCityCountryInput(locationQuery);
    if (!parsed) return;
    updateLocation({
      city: parsed.city,
      country: parsed.country,
      label: `${parsed.city}, ${parsed.country}`,
    });
  }

  function handleMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          label: "Finding your location…",
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 }
    );
  }

  const dateLine = [
    data?.islamicDate ? formatHijriDateLine(data.islamicDate) : null,
    formatGregorianDateLine(),
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell
      title="Live Namaz Times — Prayer Schedule | Your Impact Foundation"
      description="Accurate prayer (Salah) times for any city worldwide, with rakats and prayer types."
    >
      <section className="gradient-warm border-b border-border">
        <div className="container-wide pt-24 pb-12 lg:pt-28 lg:pb-16 max-w-4xl">
          <p className="text-sm uppercase tracking-[0.25em] text-accent-deep font-semibold">
            Daily worship
          </p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl lg:text-6xl text-primary leading-[1.05] text-balance">
            Live Namaz Times
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            Accurate prayer (Salah) times for any city worldwide, with rakats and prayer types.
          </p>

          <form onSubmit={handleSearch} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="City, Country (e.g. Istanbul, Turkey)"
                className="pl-9 h-11 rounded-full bg-card"
                aria-label="City and country"
              />
            </div>
            <Button type="submit" className="rounded-full h-11 px-6 shrink-0">
              Get times
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full h-11 px-6 shrink-0"
              onClick={handleMyLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              My location
            </Button>
          </form>

          <div className="mt-8 rounded-3xl gradient-plum text-primary-foreground p-6 sm:p-8 shadow-lift">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                  Now in
                </div>
                <h2 className="font-serif text-3xl sm:text-4xl mt-1">
                  {loading ? "Loading…" : data?.location || location.label}
                </h2>
                {dateLine && (
                  <p className="mt-1 text-sm text-primary-foreground/80">{dateLine}</p>
                )}
              </div>
              {!loading && (currentPrayer || nextPrayer) && (
                <div className="text-right space-y-3">
                  {currentPrayer && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                        Current waqt
                      </div>
                      <div className="font-serif text-2xl mt-1">{currentPrayer}</div>
                      {data?.timings[currentPrayer] && (
                        <div className="text-sm text-primary-foreground/80 mt-0.5">
                          started {formatPrayerTime12h(data.timings[currentPrayer])}
                        </div>
                      )}
                    </div>
                  )}
                  {nextPrayer && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
                        Next prayer
                      </div>
                      <div className="font-serif text-2xl mt-1">{nextPrayer.name}</div>
                      <div className="text-sm text-primary-foreground/80 inline-flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3.5 h-3.5" />
                        {nextPrayer.countdownLabel}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-wide py-10 lg:py-14">
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading prayer times…
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm">
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={reload}>
              Try again
            </Button>
          </div>
        )}

        {data && !loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DISPLAY_PRAYERS.map((name) => {
              const detail = PRAYER_DETAILS[name];
              const time24 = data.timings[name as keyof typeof data.timings];
              const isCurrent =
                name !== "Sunrise" && currentPrayer === (name as PrayerName);
              const isNext =
                name !== "Sunrise" &&
                !isCurrent &&
                nextPrayer?.name === (name as PrayerName);
              const displayName = name === "Sunrise" ? "Sunrise (Ishraq)" : name;

              return (
                <article
                  key={name}
                  className={cn(
                    "rounded-3xl border p-6 transition-all",
                    isCurrent
                      ? "bg-accent/15 border-accent shadow-glow ring-1 ring-accent/40"
                      : isNext
                        ? "bg-accent/10 border-accent shadow-glow"
                        : "bg-card border-border hover:shadow-lift"
                  )}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <div className="font-serif text-2xl text-foreground">{displayName}</div>
                      <div className="font-serif text-sm text-muted-foreground" lang="ar">
                        {detail.arabic}
                      </div>
                    </div>
                    <div className="font-serif text-3xl tabular-nums text-accent-deep shrink-0">
                      {time24 ? formatPrayerTime12h(time24) : "—"}
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {detail.description}
                  </p>

                  {detail.rakatPills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                      {detail.rakatPills.map((pill) => (
                        <span
                          key={pill.label}
                          className={cn(
                            "px-2.5 py-1 rounded-full",
                            pill.accent
                              ? "bg-accent text-accent-foreground"
                              : "bg-mint-soft text-accent-deep"
                          )}
                        >
                          {pill.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="mt-3 text-xs font-semibold text-accent-deep">
                      ↑ Current waqt now
                    </div>
                  )}
                  {isNext && nextPrayer && (
                    <div className="mt-3 text-xs font-semibold text-accent-deep">
                      ↑ Up next — {nextPrayer.countdownLabel}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-3xl bg-secondary/60 border border-border p-6 text-sm text-muted-foreground">
          <p className="font-serif text-lg text-primary font-semibold">A note on rakats</p>
          <p className="mt-3 leading-relaxed">
            Rakat counts above follow the Hanafi school for daily salah. Other schools may differ
            slightly (e.g. Sunnah before Asr is 4 ghair-mu&apos;akkadah). Witr is performed after
            Isha. Prayer times use the Islamic Society of North America (ISNA) angles with Hanafi
            Asr via{" "}
            <a
              href="https://aladhan.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Aladhan
            </a>
            . Searches like &ldquo;London, England&rdquo; resolve to the United Kingdom.
          </p>
        </div>
      </section>
    </PageShell>
  );
}

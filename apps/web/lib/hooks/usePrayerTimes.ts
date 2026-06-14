"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPrayerTimes, fetchPrayerTimesNearMe } from "@/lib/api";
import {
  DEFAULT_PRAYER_LOCATION,
  readPrayerLocation,
  savePrayerLocation,
  type PrayerLocation,
} from "@/lib/prayer-location";
import {
  getNextPrayer,
  type PrayerTimesResponse,
} from "@/lib/prayer-times";

export function usePrayerTimes() {
  const [location, setLocation] = useState<PrayerLocation>(DEFAULT_PRAYER_LOCATION);
  const [data, setData] = useState<PrayerTimesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (loc: PrayerLocation) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (loc.latitude != null && loc.longitude != null) {
        params.latitude = String(loc.latitude);
        params.longitude = String(loc.longitude);
      } else {
        params.city = loc.city || DEFAULT_PRAYER_LOCATION.city!;
        params.country = loc.country || DEFAULT_PRAYER_LOCATION.country!;
      }
      const result = await fetchPrayerTimes(params);
      setData(result);
      if (result.coordinates && (loc.latitude != null || loc.longitude != null)) {
        const updated: PrayerLocation = {
          ...loc,
          label: result.location,
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
        };
        savePrayerLocation(updated);
        setLocation(updated);
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not load prayer times";
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const stored = readPrayerLocation();
    setLocation(stored);
    void load(stored);
  }, [load]);

  useEffect(() => {
    const onChange = (e: Event) => {
      const loc = (e as CustomEvent<PrayerLocation>).detail ?? readPrayerLocation();
      setLocation(loc);
      void load(loc);
    };
    window.addEventListener("prayer-location-changed", onChange);
    return () => window.removeEventListener("prayer-location-changed", onChange);
  }, [load]);

  const updateLocation = useCallback(
    (loc: PrayerLocation) => {
      savePrayerLocation(loc);
      setLocation(loc);
      void load(loc);
    },
    [load]
  );

  const loadNearMe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPrayerTimesNearMe();
      setData(result);
      const loc: PrayerLocation = {
        label: result.location,
        latitude: result.coordinates?.latitude,
        longitude: result.coordinates?.longitude,
      };
      savePrayerLocation(loc);
      setLocation(loc);
      return true;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not detect your location";
      setError(message);
      setData(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const nextPrayer = data ? getNextPrayer(data.timings) : null;
  void tick;

  return {
    location,
    data,
    loading,
    error,
    nextPrayer,
    islamicDate: data?.islamicDate ?? null,
    updateLocation,
    loadNearMe,
    reload: () => load(location),
  };
}

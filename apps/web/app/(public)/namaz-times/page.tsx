"use client";

import { useState } from "react";
import { MapPin, Clock } from "lucide-react";
import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEMO_TIMES = [
  { name: "Fajr", time: "04:42" },
  { name: "Sunrise", time: "06:18" },
  { name: "Dhuhr", time: "12:55" },
  { name: "Asr", time: "16:12" },
  { name: "Maghrib", time: "19:28" },
  { name: "Isha", time: "21:02" },
];

export default function NamazTimesPage() {
  const [city, setCity] = useState("London");

  return (
    <PageShell title="Namaz Times" description="Prayer times for your city (demo).">
      <PageHero
        eyebrow="Namaz Times"
        title="Today's prayer times"
        description="Demo timetable — connect a prayer times API in Phase 2."
      />
      <section className="container-wide py-16 max-w-2xl mx-auto">
        <div className="flex gap-3 mb-8">
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="rounded-full"
          />
          <Button type="button" className="rounded-full">
            <MapPin className="w-4 h-4" /> Update
          </Button>
        </div>
        <ul className="rounded-3xl border border-border overflow-hidden divide-y divide-border">
          {DEMO_TIMES.map((p) => (
            <li
              key={p.name}
              className="flex items-center justify-between px-6 py-4 bg-card hover:bg-secondary/50"
            >
              <span className="font-serif text-lg text-primary flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                {p.name}
              </span>
              <span className="font-semibold tabular-nums">{p.time}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted-foreground text-center">
          Showing demo times for {city}. Islamic date shown in the site header.
        </p>
      </section>
    </PageShell>
  );
}

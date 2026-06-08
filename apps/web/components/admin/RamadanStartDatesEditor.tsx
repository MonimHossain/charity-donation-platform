"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RAMADAN_REGIONS,
  normalizeRamadanStartChoices,
  type RamadanRegionId,
} from "@/lib/ramadan-region";
import type { RamadanStartChoice } from "@icac/shared-types";

type Props = {
  ramadanStartDate?: string;
  startChoices?: RamadanStartChoice[];
  onChange: (next: { ramadanStartDate?: string; startChoices: RamadanStartChoice[] }) => void;
};

export default function RamadanStartDatesEditor({ ramadanStartDate, startChoices, onChange }: Props) {
  const choices = normalizeRamadanStartChoices({ ramadanStartDate, startChoices });

  function updateRegionDate(regionId: RamadanRegionId, date: string) {
    const nextChoices = choices.map((c) =>
      (c.region ?? c.id) === regionId ? { ...c, date, id: regionId, region: regionId } : c
    );
    onChange({
      ramadanStartDate: nextChoices[0]?.date ?? ramadanStartDate,
      startChoices: nextChoices,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Ramadan can begin on different dates worldwide. Set a start date for each region — donors see the
        date that matches their location automatically.
      </p>
      <div className="grid gap-3">
        {RAMADAN_REGIONS.map((region) => {
          const choice = choices.find((c) => (c.region ?? c.id) === region.id);
          return (
            <div key={region.id} className="grid gap-2 sm:grid-cols-[1fr_180px] sm:items-center">
              <Label className="text-sm font-medium">{region.label}</Label>
              <Input
                type="date"
                value={choice?.date ?? ""}
                onChange={(e) => updateRegionDate(region.id, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DONOR_SEGMENT_LABELS,
  type DonorSegmentParams,
  type DonorSegmentType,
} from "@repo/shared-types";
import { Label } from "@/components/ui/label";
import { fetchDonorSegmentCount, fetchAdminCampaigns } from "@/lib/api";
import { Loader2 } from "lucide-react";

const SEGMENT_OPTIONS = Object.entries(DONOR_SEGMENT_LABELS) as [DonorSegmentType, string][];

function defaultRecentDates(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

type Props = {
  value: DonorSegmentParams | null;
  onChange: (params: DonorSegmentParams | null) => void;
  showClear?: boolean;
};

export default function DonorAudienceFilter({ value, onChange, showClear = true }: Props) {
  const [campaigns, setCampaigns] = useState<Array<{ id: string; title: string }>>([]);
  const [counts, setCounts] = useState<{ donorCount: number; userAccountCount: number } | null>(
    null
  );
  const [countLoading, setCountLoading] = useState(false);

  const segment = value?.segment ?? "";

  useEffect(() => {
    void fetchAdminCampaigns({ limit: "200" })
      .then((res) => {
        const items = res.items || res.data || [];
        setCampaigns(
          items.map((c: { id: string; title: string }) => ({ id: c.id, title: c.title }))
        );
      })
      .catch(() => setCampaigns([]));
  }, []);

  const canCount = useMemo(() => {
    if (!value) return false;
    if (value.segment === "campaign" && !value.campaignId) return false;
    return true;
  }, [value]);

  useEffect(() => {
    if (!canCount || !value) {
      setCounts(null);
      return;
    }
    setCountLoading(true);
    void fetchDonorSegmentCount(value)
      .then(setCounts)
      .catch(() => setCounts(null))
      .finally(() => setCountLoading(false));
  }, [value, canCount]);

  function handleSegmentChange(nextSegment: string) {
    if (!nextSegment) {
      onChange(null);
      return;
    }
    const type = nextSegment as DonorSegmentType;
    if (type === "recent") {
      const dates = defaultRecentDates();
      onChange({ segment: type, ...dates });
      return;
    }
    onChange({ segment: type });
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Audience</Label>
          <select
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            value={segment}
            onChange={(e) => handleSegmentChange(e.target.value)}
          >
            {showClear && <option value="">All donors</option>}
            {SEGMENT_OPTIONS.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {segment === "campaign" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Campaign</Label>
            <select
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              value={value?.campaignId ?? ""}
              onChange={(e) =>
                onChange({
                  segment: "campaign",
                  campaignId: e.target.value || undefined,
                })
              }
            >
              <option value="">Select campaign...</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {segment === "recent" && value && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs">From</Label>
              <input
                type="date"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={value.startDate ?? ""}
                onChange={(e) =>
                  onChange({ ...value, startDate: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To</Label>
              <input
                type="date"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                value={value.endDate ?? ""}
                onChange={(e) =>
                  onChange({ ...value, endDate: e.target.value || undefined })
                }
              />
            </div>
          </>
        )}
      </div>

      {value && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          {countLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Counting matches...
            </>
          ) : counts ? (
            <>
              <span className="font-medium text-foreground">
                {counts.donorCount.toLocaleString()} donor{counts.donorCount === 1 ? "" : "s"} match
              </span>
              <span>
                ({counts.userAccountCount.toLocaleString()} with accounts)
              </span>
            </>
          ) : segment === "campaign" && !value.campaignId ? (
            <span>Select a campaign to see matching donors.</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function segmentParamsToQuery(
  params: DonorSegmentParams | null
): Record<string, string> {
  if (!params) return {};
  const query: Record<string, string> = { segment: params.segment };
  if (params.campaignId) query.campaignId = params.campaignId;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  return query;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchAdminCampaigns } from "@/lib/api";

interface CampaignOption {
  id: string;
  title: string;
  slug: string;
  status?: string;
  campaignMode?: string;
}

interface CampaignDonationEmbedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (campaign: { slug: string; title: string }) => void;
}

export function CampaignDonationEmbedDialog({
  open,
  onOpenChange,
  onSelect,
}: CampaignDonationEmbedDialogProps) {
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetchAdminCampaigns({ status: "published", limit: "100" })
      .then((res) => {
        const items = (res.items || res || []) as CampaignOption[];
        setCampaigns(
          items.filter((c) => c.slug && String(c.campaignMode ?? "") !== "fundraiser")
        );
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [campaigns, search]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert campaign donation block</DialogTitle>
          <DialogDescription>
            Choose a published campaign. Its donation options will appear inline in the article.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="pl-9"
          />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-lg border">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading campaigns...
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No published campaigns found.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((campaign) => (
                <li key={campaign.id}>
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50"
                    onClick={() => {
                      onSelect({ slug: campaign.slug, title: campaign.title });
                      onOpenChange(false);
                      setSearch("");
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/{campaign.slug}</p>
                    </div>
                    <span className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium">
                      Insert
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

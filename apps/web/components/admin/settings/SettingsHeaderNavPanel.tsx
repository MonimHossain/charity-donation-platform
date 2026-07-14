"use client";

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { GripVertical, Loader2, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  adminUpdateSiteSettings,
  fetchAdminCampaigns,
  fetchSiteSettings,
} from "@/lib/api";
import { cn } from "@/lib/utils";

type HeaderNavCampaign = {
  id: string;
  title: string;
  slug?: string;
  status?: string;
  headerLabel: string;
};

function headerLabel(c: Record<string, unknown>): string {
  const vs = c.visibilitySettings as { headerDisplayName?: string } | undefined;
  const custom = vs?.headerDisplayName?.trim();
  if (custom) return custom;
  return String(c.title ?? "");
}

function sortByHeaderOrder(items: HeaderNavCampaign[], order: string[]) {
  const index = new Map(order.map((id, i) => [id, i]));
  return [...items].sort((a, b) => {
    const ai = index.has(a.id) ? (index.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bi = index.has(b.id) ? (index.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.title.localeCompare(b.title);
  });
}

export function SettingsHeaderNavPanel() {
  const [items, setItems] = useState<HeaderNavCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, campaignsRes] = await Promise.all([
        fetchSiteSettings(),
        fetchAdminCampaigns({ limit: "200", page: "1" }),
      ]);
      const order: string[] = Array.isArray(settings?.headerNavOrder)
        ? settings.headerNavOrder.map(String)
        : [];
      const rows = (campaignsRes.items || []) as Record<string, unknown>[];
      const headerItems = rows
        .filter((c) => (c.visibilitySettings as { showInHeader?: boolean } | undefined)?.showInHeader)
        .map((c) => ({
          id: String(c.id),
          title: String(c.title ?? ""),
          slug: c.slug ? String(c.slug) : undefined,
          status: c.status ? String(c.status) : undefined,
          headerLabel: headerLabel(c),
        }));
      setItems(sortByHeaderOrder(headerItems, order));
      setDirty(false);
    } catch {
      toast.error("Failed to load header navigation campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persistOrder(ordered: HeaderNavCampaign[]) {
    const previous = items;
    setItems(ordered);
    setSaving(true);
    try {
      await adminUpdateSiteSettings({
        headerNavOrder: ordered.map((c) => c.id),
      });
      setDirty(false);
      toast.success("Header navigation order saved");
    } catch {
      setItems(previous);
      toast.error("Failed to save header navigation order");
    } finally {
      setSaving(false);
      setDragId(null);
      setDragOverId(null);
    }
  }

  function onDragStart(id: string) {
    if (saving) return;
    setDragId(id);
  }

  function onDragOver(e: DragEvent, id: string) {
    if (!dragId || dragId === id || saving) return;
    e.preventDefault();
    setDragOverId(id);
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId || saving) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const from = items.findIndex((c) => c.id === dragId);
    const to = items.findIndex((c) => c.id === targetId);
    if (from < 0 || to < 0) {
      setDragId(null);
      setDragOverId(null);
      return;
    }
    const next = [...items];
    const [moved] = next.splice(from, 1);
    if (!moved) return;
    next.splice(to, 0, moved);
    setDirty(true);
    void persistOrder(next);
  }

  function onDragEnd() {
    setDragId(null);
    setDragOverId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading header campaigns…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-serif font-bold flex items-center gap-2">
          <Menu className="h-5 w-5" />
          Header navigation order
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag to set the left-to-right order of campaigns on the public site header. Only campaigns with
          &ldquo;Show in Header Navigation&rdquo; appear here. Our Appeals order is controlled separately on the
          Campaigns list.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-xl border border-dashed p-6">
          No campaigns are marked for the header yet. Enable &ldquo;Show in Header Navigation&rdquo; on a campaign
          to add it here.
        </p>
      ) : (
        <ul className="rounded-xl border divide-y bg-background">
          {items.map((c, index) => (
            <li
              key={c.id}
              draggable={!saving}
              onDragStart={() => onDragStart(c.id)}
              onDragOver={(e) => onDragOver(e, c.id)}
              onDrop={() => onDrop(c.id)}
              onDragEnd={onDragEnd}
              className={cn(
                "flex items-center gap-3 px-3 py-3 transition-colors",
                dragOverId === c.id && dragId !== c.id && "bg-primary/5",
                dragId === c.id && "opacity-60"
              )}
            >
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1"
                aria-label={`Drag to reorder ${c.headerLabel}`}
                disabled={saving}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground w-6">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{c.headerLabel}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.title !== c.headerLabel ? `${c.title} · ` : ""}
                  {c.slug ? `/${c.slug}` : c.id}
                  {c.status ? ` · ${c.status}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => void load()} disabled={loading || saving}>
          Refresh
        </Button>
        {saving && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
          </span>
        )}
        {dirty && !saving && (
          <span className="text-xs text-muted-foreground">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}

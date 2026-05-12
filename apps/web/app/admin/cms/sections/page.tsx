"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  GripVertical,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchHomepageSections,
  adminUpdateHomepageSection,
  adminReorderSections,
} from "@/lib/api";

interface Section {
  id: string;
  type: string;
  title: string;
  enabled?: boolean;
  isEnabled?: boolean;
  layout?: string;
  sortOrder: number;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchHomepageSections();
        const items = Array.isArray(data) ? data : data.items || [];
        setSections(items);
      } catch {
        toast.error("Failed to load sections");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getSectionId(s: Section) {
    return s.id;
  }

  function isEnabled(s: Section) {
    return s.enabled ?? s.isEnabled ?? false;
  }

  async function toggleEnabled(section: Section) {
    const id = getSectionId(section);
    const newEnabled = !isEnabled(section);
    try {
      await adminUpdateHomepageSection(id, { enabled: newEnabled, isEnabled: newEnabled });
      setSections((prev) =>
        prev.map((s) =>
          getSectionId(s) === id
            ? { ...s, enabled: newEnabled, isEnabled: newEnabled }
            : s
        )
      );
      toast.success("Section updated");
    } catch {
      toast.error("Failed to update section");
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const ordered = sections
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s, i) => ({ id: getSectionId(s), sortOrder: i + 1 }));
      await adminReorderSections(ordered);
      toast.success("Sections order saved");
    } catch {
      toast.error("Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading sections...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">
            Homepage Sections
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and reorder homepage sections
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Order"
          )}
        </Button>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-10 px-3 py-3" />
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Order</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Section</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-center font-medium text-muted-foreground">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {sections
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((section) => {
                  const enabled = isEnabled(section);
                  return (
                    <tr
                      key={getSectionId(section)}
                      className={cn(
                        "border-b last:border-0 transition-colors",
                        enabled
                          ? "hover:bg-muted/30"
                          : "opacity-50 hover:bg-muted/20"
                      )}
                    >
                      <td className="px-3 py-3 text-center">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab mx-auto" />
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-semibold">
                          {section.sortOrder}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium">{section.title}</td>
                      <td className="px-5 py-3">
                        <code className="rounded bg-muted px-2 py-0.5 text-xs">
                          {section.type}
                        </code>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => toggleEnabled(section)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            enabled ? "bg-primary" : "bg-muted"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                              enabled
                                ? "translate-x-6"
                                : "translate-x-1"
                            )}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {sections.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No sections found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

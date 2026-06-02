"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDonationPage, upsertDonationPage } from "@/lib/stores/donationPageStore";
import { useDonationPageAdmin, useDonationPageMutations } from "@/lib/data/donation-pages";
import { USE_MOCK_DATA } from "@/lib/config";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DonationExperience, DonationPageDto } from "@icac/shared-types";

export default function AdminDonationPageEditPage() {
  const params = useParams<{ id: string }>();
  const storePage = useDonationPage(params.id);
  const { data: apiPage, isLoading } = useDonationPageAdmin(params.id);
  const { update } = useDonationPageMutations();
  const page = USE_MOCK_DATA ? storePage : (apiPage as DonationPageDto | undefined);
  const [saving, setSaving] = useState(false);
  const [configText, setConfigText] = useState("");

  if (isLoading && !USE_MOCK_DATA) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return <p className="text-muted-foreground">Page not found.</p>;
  }

  const publicUrl = useMemo(() => `/donation/${page.slug}`, [page.slug]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    const cfg = (page as DonationPageDto).config ?? {};
    setConfigText(JSON.stringify(cfg, null, 2));
  }, [page]);

  const saveField = async (field: "title" | "shortDescription" | "slug", value: string) => {
    if (USE_MOCK_DATA) {
      upsertDonationPage({ ...page, [field]: value, updatedAt: new Date().toISOString() });
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({ id: params.id, payload: { [field]: value } });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  async function saveConfig() {
    if (USE_MOCK_DATA) {
      toast.success("Saved (demo)");
      return;
    }
    setSaving(true);
    try {
      const parsed = JSON.parse(configText || "{}") as Record<string, unknown>;
      await update.mutateAsync({ id: params.id, payload: { config: parsed } });
      toast.success("Saved");
    } catch {
      toast.error("Config must be valid JSON");
    } finally {
      setSaving(false);
    }
  }

  function applyTemplate(exp: DonationExperience) {
    const next = {
      ...(USE_MOCK_DATA ? {} : ((page as DonationPageDto).config ?? {})),
      experience: exp,
      visibility: { homepageFeatured: false, headerFeatured: false, priority: 0 },
    };
    setConfigText(JSON.stringify(next, null, 2));
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/donation-pages">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </Button>
      <h1 className="font-serif text-2xl text-primary">Edit donation page</h1>
      <div className="space-y-4 rounded-2xl border bg-card p-6">
        {!USE_MOCK_DATA && (
          <div className="rounded-xl bg-secondary/40 border border-border p-4 text-sm">
            <p className="font-semibold text-primary">Public URL</p>
            <p className="text-muted-foreground mt-1">{publicUrl}</p>
          </div>
        )}
        <div>
          <Label>Title</Label>
          <Input
            className="mt-1"
            defaultValue={page.title}
            onBlur={(e) => saveField("title", e.target.value)}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            className="mt-1"
            defaultValue={page.slug}
            onBlur={(e) => saveField("slug", e.target.value)}
          />
        </div>
        <div>
          <Label>Short description</Label>
          <Textarea
            className="mt-1"
            defaultValue={page.shortDescription ?? ""}
            onBlur={(e) => saveField("shortDescription", e.target.value)}
          />
        </div>

        {!USE_MOCK_DATA && (
          <>
            <div>
              <Label className="text-sm font-semibold">Experience templates</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    applyTemplate({ type: "standard" })
                  }
                >
                  Standard
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    applyTemplate({
                      type: "fidya_kaffarah",
                      options: [
                        { key: "fidya", label: "Fidya", unitPrice: 5 },
                        { key: "kaffarah", label: "Kaffarah", unitPrice: 300 },
                      ],
                      quantity: { min: 1, max: 999, default: 1, label: "Quantity:" },
                      ctaBehavior: "checkout_now",
                    })
                  }
                >
                  Fidya/Kaffarah
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() =>
                    applyTemplate({
                      type: "ramadan_split",
                      nights: 30,
                      weights: Array.from({ length: 30 }, () => 1),
                      startChoices: [
                        { id: "start-1", label: "Option 1", date: new Date().toISOString().slice(0, 10) },
                      ],
                      presets: [
                        { id: "all30", label: "Maximize blessings all 30 nights", weights: Array.from({ length: 30 }, () => 1) },
                      ],
                    })
                  }
                >
                  Ramadan split
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => applyTemplate({ type: "zakat_calc" })}
                >
                  Zakat calculator
                </Button>
              </div>
            </div>

            <div>
              <Label>Config (JSON)</Label>
              <Textarea
                className="mt-1 font-mono text-xs min-h-[260px]"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  className="rounded-full bg-accent hover:bg-accent/90"
                  disabled={saving}
                  onClick={saveConfig}
                >
                  {saving ? "Saving…" : "Save config"}
                </Button>
                <Button type="button" variant="outline" className="rounded-full" asChild>
                  <Link href={publicUrl} target="_blank" rel="noreferrer">
                    Preview
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
        <Button
          className="rounded-full bg-accent hover:bg-accent/90"
          disabled={saving}
          onClick={() => toast.success(USE_MOCK_DATA ? "Saved (demo)" : "All changes saved on blur")}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

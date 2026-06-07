"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker } from "@/components/ui/file-picker";
import { getRamadanAdminConfig } from "@/lib/ramadan-split";
import { useDonationPage, upsertDonationPage } from "@/lib/stores/donationPageStore";
import { useDonationPageAdmin, useDonationPageMutations } from "@/lib/data/donation-pages";
import { USE_MOCK_DATA } from "@/lib/config";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DonationExperience, DonationPageDto } from "@icac/shared-types";
import { getExperienceMeta } from "@/lib/donation-experience";
import { cn } from "@/lib/utils";

type ExperienceType = DonationExperience["type"];

export default function AdminDonationPageEditPage() {
  const params = useParams<{ id: string }>();
  const storePage = useDonationPage(params.id);
  const { data: apiPage, isLoading } = useDonationPageAdmin(params.id);
  const { update } = useDonationPageMutations();
  const page = USE_MOCK_DATA ? storePage : (apiPage as DonationPageDto | undefined);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<DonationPageDto["status"]>("draft");
  const [category, setCategory] = useState("standard");
  const [experienceType, setExperienceType] = useState<ExperienceType>("standard");
  const [fidyaOptions, setFidyaOptions] = useState<Array<{ key: string; label: string; unitPrice: number }>>([
    { key: "fidya", label: "Fidya", unitPrice: 5 },
    { key: "kaffarah", label: "Kaffarah", unitPrice: 300 },
  ]);
  const [fidyaQty, setFidyaQty] = useState({ min: 1, max: 999, default: 1, label: "Quantity:" });
  const [fidyaAllowCustomAmount, setFidyaAllowCustomAmount] = useState(false);
  const [fidyaCustomAmount, setFidyaCustomAmount] = useState({ min: 1, max: 100000, placeholder: "Enter amount", label: "Custom amount" });
  const [ramadanStartDate, setRamadanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState("");

  const publicUrl = useMemo(() => `/campaigns/${page?.slug ?? ""}`, [page?.slug]);

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    if (!page) return;
    const cfg = (page as DonationPageDto).config ?? {};
    const exp = (cfg as any).experience as DonationExperience | undefined;
    if (!exp?.type) return;

    setExperienceType(exp.type);
    if (exp.type === "fidya_kaffarah") {
      setFidyaOptions((exp.options ?? []).map((o) => ({ key: String(o.key), label: o.label, unitPrice: Number(o.unitPrice) })));
      setFidyaQty({
        min: exp.quantity?.min ?? 1,
        max: exp.quantity?.max ?? 999,
        default: exp.quantity?.default ?? 1,
        label: exp.quantity?.label ?? "Quantity:",
      });
      setFidyaAllowCustomAmount(Boolean((exp as any).allowCustomAmount));
      setFidyaCustomAmount({
        min: Number((exp as any).customAmount?.min ?? 1),
        max: Number((exp as any).customAmount?.max ?? 100000),
        placeholder: String((exp as any).customAmount?.placeholder ?? "Enter amount"),
        label: String((exp as any).customAmount?.label ?? "Custom amount"),
      });
    } else if (exp.type === "ramadan_split") {
      const { ramadanStartDate: start } = getRamadanAdminConfig(exp);
      setRamadanStartDate(start);
    }

    setImage(String((page as any).image ?? ""));
    setCategory(String((page as any).category ?? "standard"));
    setStatus(((page as any).status ?? "draft") as DonationPageDto["status"]);
  }, [page]);

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

  const saveStatus = async (nextStatus: DonationPageDto["status"]) => {
    if (USE_MOCK_DATA) {
      upsertDonationPage({ ...page, status: nextStatus as any, updatedAt: new Date().toISOString() });
      toast.success("Saved");
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({ id: params.id, payload: { status: nextStatus } });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  function buildExperience(): DonationExperience {
    if (experienceType === "fidya_kaffarah") {
      return {
        type: "fidya_kaffarah",
        options: fidyaOptions.map((o) => ({ key: o.key, label: o.label, unitPrice: Number(o.unitPrice) })),
        quantity: { ...fidyaQty },
        allowCustomAmount: fidyaAllowCustomAmount,
        customAmount: { ...fidyaCustomAmount },
        ctaBehavior: "checkout_now",
      };
    }
    if (experienceType === "ramadan_split") {
      return {
        type: "ramadan_split",
        ramadanStartDate,
        maxNights: 30,
        campaignId: (page as DonationPageDto).campaignId ?? undefined,
      };
    }
    return { type: "standard" };
  }

  async function saveExperience() {
    if (USE_MOCK_DATA) {
      toast.success("Saved (demo)");
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({
        id: params.id,
        payload: {
          config: {
            ...((page as DonationPageDto).config ?? {}),
            experience: buildExperience(),
            visibility: { homepageFeatured: false, headerFeatured: false, priority: 0 },
          },
        },
      });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/campaigns">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </Button>
      <div className="space-y-2">
        <h1 className="font-serif text-2xl text-primary">Edit donation page</h1>
        {!USE_MOCK_DATA && (
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const meta = getExperienceMeta(experienceType);
              const Icon = meta.icon;
              return (
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium", meta.badgeClass)}>
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </span>
              );
            })()}
            <span className="text-sm text-muted-foreground">{getExperienceMeta(experienceType).description}</span>
          </div>
        )}
      </div>
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

        <div>
          <Label>Status</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as DonationPageDto["status"])}
            onBlur={(e) => saveStatus((e.target as HTMLSelectElement).value as DonationPageDto["status"])}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Only <span className="font-semibold">Published</span> pages show on the landing page.
          </p>
        </div>

        {!USE_MOCK_DATA && (
          <div>
            <Label>Category</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={(e) => update.mutateAsync({ id: params.id, payload: { category: (e.target as HTMLSelectElement).value } })}
            >
              <option value="standard">Standard donation</option>
              <option value="fidya">Fidya</option>
              <option value="kaffarah">Kaffarah</option>
              <option value="ramadan">Ramadan</option>
              <option value="general">General</option>
            </select>
          </div>
        )}

        {!USE_MOCK_DATA && (
          <div>
            <Label>Image (optional)</Label>
            <div className="mt-1">
              <FilePicker
                value={image}
                onChange={(url) => {
                  setImage(url);
                  update.mutateAsync({ id: params.id, payload: { image: url } });
                }}
                accept="image"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              If empty, the homepage will show a default image.
            </p>
          </div>
        )}

        {!USE_MOCK_DATA && (
          <>
            <div>
              <Label className="text-sm font-semibold">Experience</Label>
              <select
                className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={experienceType}
                onChange={(e) => setExperienceType(e.target.value as any)}
              >
                <option value="standard">Standard</option>
                <option value="fidya_kaffarah">Fidya / Kaffarah</option>
                <option value="ramadan_split">Ramadan split</option>
              </select>
            </div>

            <div>
              {experienceType === "fidya_kaffarah" && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Options</Label>
                  {fidyaOptions.map((o, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <Input value={o.label} onChange={(e) => setFidyaOptions((p) => p.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))} placeholder="Label" />
                      <Input value={o.key} onChange={(e) => setFidyaOptions((p) => p.map((x, i) => (i === idx ? { ...x, key: e.target.value } : x)))} placeholder="Key" />
                      <Input type="number" value={o.unitPrice} onChange={(e) => setFidyaOptions((p) => p.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x)))} placeholder="Unit price" />
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setFidyaOptions((p) => [...p, { key: `opt-${p.length + 1}`, label: "New option", unitPrice: 0 }])}>
                    Add option
                  </Button>

                  <div className="grid grid-cols-4 gap-2">
                    <Input type="number" value={fidyaQty.min} onChange={(e) => setFidyaQty((p) => ({ ...p, min: Number(e.target.value) }))} placeholder="Min" />
                    <Input type="number" value={fidyaQty.max} onChange={(e) => setFidyaQty((p) => ({ ...p, max: Number(e.target.value) }))} placeholder="Max" />
                    <Input type="number" value={fidyaQty.default} onChange={(e) => setFidyaQty((p) => ({ ...p, default: Number(e.target.value) }))} placeholder="Default" />
                    <Input value={fidyaQty.label} onChange={(e) => setFidyaQty((p) => ({ ...p, label: e.target.value }))} placeholder="Quantity label" />
                  </div>

                  <div className="rounded-xl border border-border p-4 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={fidyaAllowCustomAmount}
                        onChange={(e) => setFidyaAllowCustomAmount(e.target.checked)}
                      />
                      Allow custom amount (donor can override total)
                    </label>
                    {fidyaAllowCustomAmount && (
                      <div className="grid grid-cols-4 gap-2">
                        <Input type="number" value={fidyaCustomAmount.min} onChange={(e) => setFidyaCustomAmount((p) => ({ ...p, min: Number(e.target.value) }))} placeholder="Min amount" />
                        <Input type="number" value={fidyaCustomAmount.max} onChange={(e) => setFidyaCustomAmount((p) => ({ ...p, max: Number(e.target.value) }))} placeholder="Max amount" />
                        <Input value={fidyaCustomAmount.label} onChange={(e) => setFidyaCustomAmount((p) => ({ ...p, label: e.target.value }))} placeholder="Label" />
                        <Input value={fidyaCustomAmount.placeholder} onChange={(e) => setFidyaCustomAmount((p) => ({ ...p, placeholder: e.target.value }))} placeholder="Placeholder" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {experienceType === "ramadan_split" && (
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Ramadan start date</Label>
                  <Input
                    type="date"
                    value={ramadanStartDate}
                    onChange={(e) => setRamadanStartDate(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Donors pick which nights to give (up to 30) and optional weights on the public page.
                    You do not set nights or weights here.
                  </p>
                </div>
              )}

              {experienceType === "standard" && (
                <p className="text-sm text-muted-foreground">
                  Standard uses the universal donate flow.
                </p>
              )}
            </div>
          </>
        )}

        <div className="pt-2 flex flex-wrap gap-2">
          <Button
            type="button"
            className="rounded-full bg-accent hover:bg-accent/90"
            disabled={saving}
            onClick={saveExperience}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          {!USE_MOCK_DATA && (
            <Button type="button" variant="outline" className="rounded-full" asChild>
              <Link href={`/admin/donation-pages/${params.id}/preview`} target="_blank" rel="noreferrer">
                Preview
              </Link>
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Title, slug, status, and category save when you leave each field. Use Save to store experience settings.
        </p>
      </div>
    </div>
  );
}

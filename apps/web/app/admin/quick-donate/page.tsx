"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  fetchAdminQuickDonateOptions,
  fetchAdminQuickDonateSettings,
  createAdminQuickDonateOption,
  updateAdminQuickDonateOption,
  deleteAdminQuickDonateOption,
  updateAdminQuickDonateSettings,
  fetchCampaigns,
} from "@/lib/api";
import type { DonationCategoryOption } from "@/lib/quick-donate";
import { isQuickDonateCampaignMode, slugifyLabel } from "@/lib/quick-donate";
import { CAMPAIGN_MODE_LABELS } from "@/lib/campaign-experience";

type CategoryRow = DonationCategoryOption & { rowId: string };

function toCategoryRows(items: DonationCategoryOption[]): CategoryRow[] {
  return items.map((c, i) => ({
    ...c,
    rowId: `cat-${i}-${c.value || "new"}`,
  }));
}

function stripCategoryRows(rows: CategoryRow[]): DonationCategoryOption[] {
  return rows.map(({ rowId: _rowId, ...c }) => c);
}

interface QuickDonateOptionRow {
  id: string;
  label: string;
  campaignId?: string | null;
  campaignSlug?: string | null;
  campaignTitle?: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface CampaignOption {
  id: string;
  title: string;
  slug: string;
  status?: string;
  campaignMode?: string;
  attributes?: Array<{
    enableSinglePayment?: boolean;
    enableRegularPayment?: boolean;
    singlePaymentConfig?: { priceType?: string; presetAmounts?: unknown[] };
    regularPaymentConfig?: { priceType?: string; presetAmounts?: unknown[] };
  }>;
}

function paymentConfigHasDonationOptions(
  config?: { priceType?: string; presetAmounts?: unknown[] } | null
): boolean {
  if (!config) return false;
  const hasPresets = (config.presetAmounts?.length ?? 0) > 0;
  const allowsCustom = config.priceType === "custom" || config.priceType === "both";
  return hasPresets || allowsCustom;
}

function attributeHasDonationOptions(attr: NonNullable<CampaignOption["attributes"]>[number]): boolean {
  if (attr.enableSinglePayment && paymentConfigHasDonationOptions(attr.singlePaymentConfig)) {
    return true;
  }
  if (attr.enableRegularPayment && paymentConfigHasDonationOptions(attr.regularPaymentConfig)) {
    return true;
  }
  return false;
}

function campaignEligibleForQuickDonate(c: CampaignOption): boolean {
  if (c.status && c.status !== "published") return false;
  if (!isQuickDonateCampaignMode(c.campaignMode || "standard")) return false;
  const attrs = c.attributes || [];
  if (!attrs.length) return false;
  return attrs.some(attributeHasDonationOptions);
}

function campaignModeLabel(mode?: string): string {
  const key = mode || "standard";
  return CAMPAIGN_MODE_LABELS[key] || key.replace(/_/g, " ");
}

const emptyOptionForm = {
  label: "",
  campaignId: "",
  sortOrder: 0,
  isActive: true,
};

export default function QuickDonateAdminPage() {
  const [options, setOptions] = useState<QuickDonateOptionRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyOptionForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState<Record<string, boolean>>({});

  async function loadAll() {
    try {
      const [optionsRes, settingsRes, campaignsRes] = await Promise.all([
        fetchAdminQuickDonateOptions(),
        fetchAdminQuickDonateSettings(),
        fetchCampaigns({ limit: "200", status: "published" }),
      ]);
      setOptions(optionsRes.items || optionsRes || []);
      setCategories(toCategoryRows(settingsRes.donationCategories || []));
      const campaignItems = campaignsRes.items || campaignsRes.data || campaignsRes || [];
      setCampaigns(
        campaignItems
          .map((c: CampaignOption) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            status: c.status,
            campaignMode: c.campaignMode,
            attributes: c.attributes,
          }))
          .filter(campaignEligibleForQuickDonate)
      );
    } catch {
      toast.error("Failed to load quick donate configuration");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setForm({
      ...emptyOptionForm,
      sortOrder: options.length,
    });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(row: QuickDonateOptionRow) {
    setForm({
      label: row.label,
      campaignId: row.campaignId || "",
      sortOrder: row.sortOrder,
      isActive: row.isActive,
    });
    setEditingId(row.id);
    setShowModal(true);
  }

  async function handleSaveOption() {
    if (!form.label.trim()) {
      toast.error("Display label is required");
      return;
    }
    if (!form.campaignId) {
      toast.error("Linked campaign is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        campaignId: form.campaignId,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };
      if (editingId) {
        await updateAdminQuickDonateOption(editingId, payload);
        toast.success("Option updated");
      } else {
        await createAdminQuickDonateOption(payload);
        toast.success("Option created");
      }
      setShowModal(false);
      await loadAll();
    } catch {
      toast.error("Failed to save option");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this quick donate option?")) return;
    setDeleting(id);
    try {
      await deleteAdminQuickDonateOption(id);
      toast.success("Option deleted");
      await loadAll();
    } catch {
      toast.error("Failed to delete option");
    } finally {
      setDeleting(null);
    }
  }

  async function saveCategories() {
    setSavingSettings(true);
    try {
      await updateAdminQuickDonateSettings({ donationCategories: stripCategoryRows(categories) });
      toast.success("Donation categories saved");
    } catch {
      toast.error("Failed to save categories");
    } finally {
      setSavingSettings(false);
    }
  }

  function addCategory() {
    setCategories((prev) => [
      ...prev,
      {
        rowId: crypto.randomUUID(),
        value: `category-${prev.length + 1}`,
        label: "New category",
        sortOrder: prev.length,
        isActive: true,
      },
    ]);
  }

  function updateCategoryLabel(rowId: string, label: string) {
    setCategories((prev) =>
      prev.map((c) => {
        if (c.rowId !== rowId) return c;
        const next = { ...c, label };
        if (!slugManual[rowId]) {
          next.value = slugifyLabel(label) || next.value;
        }
        return next;
      })
    );
  }

  function updateCategoryValue(rowId: string, value: string) {
    setSlugManual((prev) => ({ ...prev, [rowId]: true }));
    setCategories((prev) =>
      prev.map((c) => (c.rowId === rowId ? { ...c, value } : c))
    );
  }

  function removeCategory(rowId: string) {
    setCategories((prev) => prev.filter((c) => c.rowId !== rowId));
    setSlugManual((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading quick donate form…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight flex items-center gap-2">
          <HandCoins className="h-7 w-7 text-primary" /> Quick Donate Form
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Each dropdown option links to a published Standard, Fundraiser, or Ramadan Split campaign.
          Attribute tabs, prices, and descriptions on the homepage quick donate widget come from that
          campaign&apos;s donation attributes — nothing is hardcoded on the frontend.
        </p>
      </div>

      <section className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Donation categories</h2>
            <p className="text-sm text-muted-foreground">
              Independent dropdown shown as &ldquo;Donation category&rdquo; on the frontend (e.g. General, Zakat, Sadaqah).
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addCategory}>
              <Plus className="h-4 w-4" /> Add category
            </Button>
            <Button size="sm" onClick={saveCategories} disabled={savingSettings}>
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save categories
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.rowId} className="grid gap-2 sm:grid-cols-12 items-center">
              <Input
                className="sm:col-span-3"
                value={cat.label}
                onChange={(e) => updateCategoryLabel(cat.rowId, e.target.value)}
                placeholder="Label"
              />
              <Input
                className="sm:col-span-3"
                value={cat.value}
                onChange={(e) => updateCategoryValue(cat.rowId, e.target.value)}
                placeholder="Slug (auto from name)"
              />
              <Input
                className="sm:col-span-2"
                type="number"
                value={cat.sortOrder}
                onChange={(e) =>
                  setCategories((prev) =>
                    prev.map((c) =>
                      c.rowId === cat.rowId
                        ? { ...c, sortOrder: Number(e.target.value) }
                        : c
                    )
                  )
                }
                placeholder="Order"
              />
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={cat.isActive}
                  onChange={(e) =>
                    setCategories((prev) =>
                      prev.map((c) =>
                        c.rowId === cat.rowId ? { ...c, isActive: e.target.checked } : c
                      )
                    )
                  }
                />
                Active
              </label>
              <Button
                variant="ghost"
                size="icon"
                className="sm:col-span-2 text-destructive"
                onClick={() => removeCategory(cat.rowId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Donate-to dropdown options</h2>
            <p className="text-sm text-muted-foreground">
              Label, linked campaign, and sort order only. Donation amounts and attribute tabs come from the campaign.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Create option
          </Button>
        </div>

        <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Will appear as</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Linked campaign</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Sort order</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {options.length > 0 ? (
                options.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3 font-medium">{row.label}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {row.campaignTitle || row.campaignSlug || (
                        <span className="text-amber-700">Not linked — hidden on site</span>
                      )}
                    </td>
                    <td className="px-5 py-3">{row.sortOrder}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                          row.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                        )}
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(row.id)}
                          disabled={deleting === row.id}
                        >
                          {deleting === row.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No options yet. Create one to populate the frontend dropdown.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">
                {editingId ? "Edit dropdown option" : "Create dropdown option"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Will appear as (dropdown label) *</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="e.g. Gaza Emergency"
                />
              </div>

              <div className="space-y-2">
                <Label>Linked campaign *</Label>
                <select
                  value={form.campaignId}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select a campaign…</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} — {campaignModeLabel(c.campaignMode)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Published Standard, Fundraiser, and Ramadan Split campaigns with donation attributes.
                  Attribute names, prices, and descriptions are taken directly from the campaign.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sort order</Label>
                  <Input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm pt-8">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                  Active on frontend
                </label>
              </div>

              <Separator />

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveOption} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

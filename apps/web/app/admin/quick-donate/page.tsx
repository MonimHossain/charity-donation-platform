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
  GripVertical,
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
import { slugifyLabel } from "@/lib/quick-donate";

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
  prices: { amount: number; sortOrder: number }[];
  sortOrder: number;
  isActive: boolean;
  allowCustomPrice: boolean;
}

interface CampaignOption {
  id: string;
  title: string;
  slug: string;
}

const emptyOptionForm = {
  label: "",
  campaignId: "",
  prices: [{ amount: 20, sortOrder: 0 }, { amount: 40, sortOrder: 1 }, { amount: 50, sortOrder: 2 }],
  sortOrder: 0,
  isActive: true,
  allowCustomPrice: false,
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
        fetchCampaigns({ limit: "200" }),
      ]);
      setOptions(optionsRes.items || optionsRes || []);
      setCategories(toCategoryRows(settingsRes.donationCategories || []));
      const campaignItems = campaignsRes.items || campaignsRes.data || campaignsRes || [];
      setCampaigns(
        campaignItems.map((c: Record<string, string>) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
        }))
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

  async function loadPublishedCampaigns() {
    try {
      const campaignsRes = await fetchCampaigns({ limit: "200" });
      const campaignItems = campaignsRes.items || campaignsRes.data || campaignsRes || [];
      setCampaigns(
        campaignItems.map((c: Record<string, string>) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
        }))
      );
    } catch {
      /* keep existing list */
    }
  }

  function openCreate() {
    setForm({
      ...emptyOptionForm,
      sortOrder: options.length,
    });
    setEditingId(null);
    setShowModal(true);
    void loadPublishedCampaigns();
  }

  function openEdit(row: QuickDonateOptionRow) {
    setForm({
      label: row.label,
      campaignId: row.campaignId || "",
      prices: row.prices.length
        ? row.prices.map((p, i) => ({ amount: p.amount, sortOrder: p.sortOrder ?? i }))
        : [{ amount: 20, sortOrder: 0 }],
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      allowCustomPrice: row.allowCustomPrice ?? false,
    });
    setEditingId(row.id);
    setShowModal(true);
    void loadPublishedCampaigns();
  }

  async function handleSaveOption() {
    if (!form.label.trim()) {
      toast.error("Display label is required");
      return;
    }
    const prices = form.prices
      .map((p, i) => ({ amount: Number(p.amount), sortOrder: i }))
      .filter((p) => Number.isFinite(p.amount) && p.amount > 0);
    if (!prices.length) {
      toast.error("Add at least one price");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: form.label.trim(),
        campaignId: form.campaignId || null,
        prices,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
        allowCustomPrice: form.allowCustomPrice,
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

  function updatePrice(index: number, amount: number) {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.map((p, i) => (i === index ? { ...p, amount } : p)),
    }));
  }

  function addPrice() {
    setForm((prev) => ({
      ...prev,
      prices: [...prev.prices, { amount: 0, sortOrder: prev.prices.length }],
    }));
  }

  function removePrice(index: number) {
    setForm((prev) => ({
      ...prev,
      prices: prev.prices.filter((_, i) => i !== index),
    }));
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
          Configure the homepage quick donate widget and sticky donate bar. Dropdown items control
          the &ldquo;I&apos;d like to donate to&rdquo; list; each item has its own price presets.
          Donation category and single/regular frequency are independent settings.
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
              Link each item to a campaign and set custom prices. The first price is selected by default when the item is chosen.
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
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Label</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Campaign</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Prices</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Order</th>
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
                      {row.campaignTitle || row.campaignSlug || "—"}
                    </td>
                    <td className="px-5 py-3">
                      {row.prices?.map((p) => `£${p.amount}`).join(", ") || "—"}
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
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-lg p-6">
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
                <Label>Linked campaign</Label>
                <select
                  value={form.campaignId}
                  onChange={(e) => setForm({ ...form, campaignId: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— No campaign link —</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.slug})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Donations through this option are credited to the linked campaign&apos;s raised total
                  on the public campaigns list after payment succeeds.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Price presets for this option</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPrice}>
                    <Plus className="h-3.5 w-3.5" /> Add price
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.prices.map((price, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium w-6">£</span>
                      <Input
                        type="number"
                        min={1}
                        value={price.amount || ""}
                        onChange={(e) => updatePrice(index, Number(e.target.value))}
                        className="flex-1"
                      />
                      {form.prices.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => removePrice(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  The 2nd-lowest price is auto-selected when this option is chosen on the frontend.
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
                <div className="flex flex-col gap-3 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    Active on frontend
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.allowCustomPrice}
                      onChange={(e) => setForm({ ...form, allowCustomPrice: e.target.checked })}
                    />
                    Allow custom price option
                  </label>
                </div>
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

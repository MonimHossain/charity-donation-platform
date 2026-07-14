"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { FilePicker } from "@/components/ui/file-picker";
import { cn, imageAltFromSrc } from "@/lib/utils";
import {
  adminCreateUpsell,
  adminDeleteUpsell,
  adminUpdateUpsell,
  fetchAdminUpsells,
} from "@/lib/api";

interface UpsellItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = {
  name: "",
  description: "",
  image: "",
  amount: "",
  isActive: true,
};

export default function AdminUpsellsPage() {
  const [items, setItems] = useState<UpsellItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadItems() {
    try {
      const data = await fetchAdminUpsells();
      setItems((Array.isArray(data.items) ? data.items : []) as UpsellItem[]);
    } catch {
      toast.error("Failed to load upsells");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(item: UpsellItem) {
    setForm({
      name: item.name,
      description: item.description,
      image: item.image || "",
      amount: String(item.amount ?? 0),
      isActive: item.isActive,
    });
    setEditingId(item.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const parsedAmount = Number(form.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        image: form.image || undefined,
        amount: parsedAmount,
        isActive: form.isActive,
        sortOrder: editingId ? undefined : items.length,
      };
      if (editingId) {
        await adminUpdateUpsell(editingId, payload);
        toast.success("Upsell updated");
      } else {
        await adminCreateUpsell(payload);
        toast.success("Upsell created");
      }
      setShowModal(false);
      setEditingId(null);
      await loadItems();
    } catch {
      toast.error("Failed to save upsell");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this upsell?")) return;
    setDeleting(id);
    try {
      await adminDeleteUpsell(id);
      toast.success("Upsell deleted");
      await loadItems();
    } catch {
      toast.error("Failed to delete upsell");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-accent-deep" />
            Upsells
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create reusable checkout upsells with name, amount, optional image, and description.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New upsell
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          No upsells yet. Create one to attach it to campaigns at checkout.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border bg-card overflow-hidden shadow-soft">
              {item.image ? (
                <div className="relative aspect-[16/9] bg-muted">
                  <img src={item.image} alt={imageAltFromSrc(item.image)} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[16/9] bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm font-bold text-accent mt-1 tabular-nums">
                      £{Number(item.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.description}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                      item.isActive ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {item.isActive ? "Active" : "Hidden"}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deleting === item.id}
                    onClick={() => handleDelete(item.id)}
                  >
                    {deleting === item.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-card border shadow-lift p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">
                {editingId ? "Edit upsell" : "New upsell"}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Sponsor a food parcel"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="e.g. 5"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Short copy shown on checkout"
                />
              </div>
              <div className="space-y-2">
                <Label>Image (optional)</Label>
                <FilePicker
                  value={form.image}
                  onChange={(url) => setForm((p) => ({ ...p, image: url }))}
                  accept="image"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save upsell"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, X, GripVertical, Loader2 } from "lucide-react";
import { fetchDonationPresets, adminUpdateDonationPreset } from "@/lib/api";

interface Preset {
  id: string;
  amount: number;
  label: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Preset>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDonationPresets();
        setPresets(Array.isArray(data) ? data : data.items || []);
      } catch {
        toast.error("Failed to load donation presets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getPresetId(p: Preset) {
    return p.id;
  }

  function startEdit(preset: Preset) {
    setEditing(getPresetId(preset));
    setEditForm({ ...preset });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        amount: editForm.amount,
        label: editForm.label,
        description: editForm.description,
        sortOrder: editForm.sortOrder,
        isActive: editForm.isActive,
      };
      await adminUpdateDonationPreset(editing, payload);
      setPresets((prev) =>
        prev.map((p) =>
          getPresetId(p) === editing ? { ...p, ...editForm } : p
        )
      );
      setEditing(null);
      toast.success("Preset updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update preset");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(preset: Preset) {
    const id = getPresetId(preset);
    try {
      await adminUpdateDonationPreset(id, { isActive: !preset.isActive });
      setPresets((prev) =>
        prev.map((p) =>
          getPresetId(p) === id ? { ...p, isActive: !p.isActive } : p
        )
      );
      toast.success("Preset updated");
    } catch {
      toast.error("Failed to update preset");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading presets...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Donation Presets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage quick donation amount presets shown on the sticky bar and donate forms</p>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-[40px_80px_120px_1fr_80px_100px_100px] gap-3 px-4 py-3 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span></span>
          <span>Amount</span>
          <span>Label</span>
          <span>Description</span>
          <span>Order</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {presets.map((preset) => {
          const id = getPresetId(preset);
          return (
            <div key={id} className="grid grid-cols-[40px_80px_120px_1fr_80px_100px_100px] gap-3 px-4 py-3 border-t border-border items-center">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              {editing === id ? (
                <>
                  <Input type="number" value={editForm.amount ?? ""} onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })} className="h-8 text-sm" />
                  <Input value={editForm.label ?? ""} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} className="h-8 text-sm" />
                  <Input value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-8 text-sm" />
                  <Input type="number" value={editForm.sortOrder ?? ""} onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })} className="h-8 text-sm" />
                  <span />
                  <div className="flex gap-1">
                    <Button size="sm" onClick={saveEdit} disabled={saving} className="h-7 px-2">
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)} className="h-7 px-2">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <span className="font-bold text-sm">£{preset.amount}</span>
                  <span className="text-sm">{preset.label}</span>
                  <span className="text-sm text-muted-foreground">{preset.description}</span>
                  <span className="text-sm text-muted-foreground">{preset.sortOrder}</span>
                  <button
                    onClick={() => toggleActive(preset)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${preset.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                  >
                    {preset.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(preset)} className="h-7 px-2">
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {presets.length === 0 && (
          <div className="px-4 py-10 text-center text-muted-foreground border-t">
            No donation presets found
          </div>
        )}
      </div>
    </div>
  );
}

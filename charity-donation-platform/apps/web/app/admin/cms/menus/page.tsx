"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Loader2,
  Navigation,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface MenuItem {
  id: string;
  label: string;
  url: string;
  location: string;
  parentId: string | null;
  target: string;
  icon: string;
  sortOrder: number;
}

type Location = "header" | "footer" | "mobile";

const emptyForm = {
  label: "",
  url: "",
  location: "header" as Location,
  parentId: "",
  target: "_self",
  icon: "",
  sortOrder: 0,
};

const locationLabels: Record<string, string> = {
  header: "Header Navigation",
  footer: "Footer Navigation",
  mobile: "Mobile Menu",
};

export default function MenusPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<Location>("header");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadMenus() {
    try {
      const { data } = await api.get("/cms/navigation");
      setItems(data.items || data || []);
    } catch {
      toast.error("Failed to load menus");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenus();
  }, []);

  const locationItems = items
    .filter((i) => i.location === activeLocation)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const parentItems = locationItems.filter((i) => !i.parentId);
  const childrenOf = (id: string) => locationItems.filter((i) => i.parentId === id).sort((a, b) => a.sortOrder - b.sortOrder);

  function openCreate() {
    setForm({ ...emptyForm, location: activeLocation });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(item: MenuItem) {
    setForm({
      label: item.label,
      url: item.url,
      location: item.location as Location,
      parentId: item.parentId || "",
      target: item.target || "_self",
      icon: item.icon || "",
      sortOrder: item.sortOrder,
    });
    setEditingId(item.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.label.trim()) {
      toast.error("Label is required");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, parentId: form.parentId || null };
      if (editingId) {
        await api.put(`/admin/cms/navigation/${editingId}`, payload);
        toast.success("Menu item updated");
      } else {
        await api.post("/admin/cms/navigation", payload);
        toast.success("Menu item created");
      }
      setShowModal(false);
      setEditingId(null);
      await loadMenus();
    } catch {
      toast.error("Failed to save menu item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this menu item?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/cms/navigation/${id}`);
      toast.success("Menu item deleted");
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = locationItems.findIndex((i) => i.id === id);
    if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= locationItems.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updates = [
      { id: locationItems[idx].id, sortOrder: locationItems[swapIdx].sortOrder },
      { id: locationItems[swapIdx].id, sortOrder: locationItems[idx].sortOrder },
    ];
    try {
      await api.post("/admin/cms/navigation/reorder", { items: updates });
      await loadMenus();
    } catch {
      toast.error("Failed to reorder");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading menus...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage navigation menus across the site</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Menu Item
        </Button>
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit">
        {(["header", "footer", "mobile"] as Location[]).map((loc) => (
          <button
            key={loc}
            onClick={() => setActiveLocation(loc)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize",
              activeLocation === loc ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >
            {locationLabels[loc]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="p-5">
          <h2 className="font-serif font-bold">{locationLabels[activeLocation]}</h2>
        </div>
        <Separator />
        <div className="divide-y">
          {parentItems.length > 0 ? parentItems.map((item) => (
            <div key={item.id}>
              <div className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <Navigation className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {item.url}
                    {item.target === "_blank" && <ExternalLink className="h-3 w-3" />}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(item.id, "up")}>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(item.id, "down")}>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                    {deleting === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              {childrenOf(item.id).map((child) => (
                <div key={child.id} className="flex items-center gap-3 pl-12 pr-5 py-2 bg-muted/20 hover:bg-muted/40 transition-colors border-l-2 border-primary/20 ml-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{child.label}</p>
                    <p className="text-xs text-muted-foreground">{child.url}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(child.id, "up")}>
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(child.id, "down")}>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(child)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(child.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )) : (
            <div className="px-5 py-10 text-center text-muted-foreground">No menu items for this location</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingId ? "Edit Menu Item" : "Add Menu Item"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label *</Label>
                  <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="/about" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Location</Label>
                  <select value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value as Location })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="header">Header</option>
                    <option value="footer">Footer</option>
                    <option value="mobile">Mobile</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Target</Label>
                  <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="_self">Same Window</option>
                    <option value="_blank">New Tab</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Parent</Label>
                  <select value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">None (Top Level)</option>
                    {parentItems.filter((p) => p.id !== editingId).map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Icon (optional class name)</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="e.g. home, heart" />
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

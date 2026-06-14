"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  Flag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilePicker } from "@/components/ui/file-picker";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Banner {
  id: string;
  title: string;
  content: string;
  type: string;
  ctaText: string;
  ctaUrl: string;
  backgroundColor: string;
  textColor: string;
  backgroundImage?: string;
  imageUrl?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  sortOrder: number;
  dismissible?: boolean;
  position?: string;
}

type BannerType = "all" | "banner" | "popup" | "emergency_appeal" | "announcement";

const typeStyles: Record<string, string> = {
  banner: "bg-blue-100 text-blue-700",
  popup: "bg-violet-100 text-violet-700",
  emergency_appeal: "bg-red-100 text-red-700",
  announcement: "bg-amber-100 text-amber-700",
};

const typeDefaults: Record<string, { backgroundColor: string; textColor: string; position: string }> = {
  emergency_appeal: { backgroundColor: "#dc2626", textColor: "#ffffff", position: "top_bar" },
  announcement: { backgroundColor: "#d97706", textColor: "#ffffff", position: "top_bar" },
  banner: { backgroundColor: "#1e40af", textColor: "#ffffff", position: "inline" },
  popup: { backgroundColor: "#6d28d9", textColor: "#ffffff", position: "popup" },
};

const emptyForm = {
  title: "",
  content: "",
  type: "banner",
  ctaText: "",
  ctaUrl: "",
  backgroundColor: "#1e40af",
  textColor: "#ffffff",
  imageUrl: "",
  isActive: true,
  startDate: "",
  endDate: "",
  dismissible: true,
  position: "inline",
};

function toFormPayload(form: typeof emptyForm) {
  return {
    title: form.title,
    content: form.content,
    type: form.type,
    ctaText: form.ctaText || null,
    ctaUrl: form.ctaUrl || null,
    backgroundColor: form.backgroundColor,
    textColor: form.textColor,
    backgroundImage: form.imageUrl || null,
    isActive: form.isActive,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    dismissible: form.dismissible,
    position: form.position || typeDefaults[form.type]?.position || "inline",
  };
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<BannerType>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  async function loadBanners() {
    try {
      const { data } = await api.get("/admin/cms/banners");
      setBanners(data.items || data || []);
    } catch {
      toast.error("Failed to load banners");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBanners();
  }, []);

  const filtered = banners.filter((b) => typeFilter === "all" || b.type === typeFilter);

  function openCreate() {
    setForm({ ...emptyForm, type: "emergency_appeal", ...typeDefaults.emergency_appeal, ctaText: "Donate now", ctaUrl: "/donate" });
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(b: Banner) {
    setForm({
      title: b.title,
      content: b.content || "",
      type: b.type,
      ctaText: b.ctaText || "",
      ctaUrl: b.ctaUrl || "",
      backgroundColor: b.backgroundColor || "#1e40af",
      textColor: b.textColor || "#ffffff",
      imageUrl: b.backgroundImage || b.imageUrl || "",
      isActive: b.isActive,
      startDate: b.startDate ? b.startDate.split("T")[0] : "",
      endDate: b.endDate ? b.endDate.split("T")[0] : "",
      dismissible: b.dismissible ?? true,
      position: b.position || typeDefaults[b.type]?.position || "inline",
    });
    setEditingId(b.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = toFormPayload(form);
      if (editingId) {
        await api.put(`/admin/cms/banners/${editingId}`, payload);
        toast.success("Banner updated");
      } else {
        await api.post("/admin/cms/banners", payload);
        toast.success("Banner created");
      }
      setShowModal(false);
      setEditingId(null);
      await loadBanners();
    } catch {
      toast.error("Failed to save banner");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this banner?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/cms/banners/${id}`);
      toast.success("Banner deleted");
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch {
      toast.error("Failed to delete banner");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(b: Banner) {
    try {
      await api.put(`/admin/cms/banners/${b.id}`, { isActive: !b.isActive });
      toast.success(b.isActive ? "Banner deactivated" : "Banner activated");
      await loadBanners();
    } catch {
      toast.error("Failed to toggle status");
    }
  }

  const previewBanner = previewId ? banners.find((b) => b.id === previewId) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading banners...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Banners &amp; Popups</h1>
          <p className="text-muted-foreground mt-1">
            Manage site banners, popups and announcements.{" "}
            <span className="text-foreground/80">
              The red top bar on the public site is controlled by an active <strong>Emergency Appeal</strong> banner.
            </span>
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Banner
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-muted-foreground" />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as BannerType)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Types</option>
          <option value="banner">Banner</option>
          <option value="popup">Popup</option>
          <option value="emergency_appeal">Emergency Appeal</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Dates</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium max-w-[250px] truncate">{b.title}</td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", typeStyles[b.type] || "bg-slate-100 text-slate-600")}>
                      {b.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", b.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs">
                    {b.startDate ? new Date(b.startDate).toLocaleDateString() : "—"} — {b.endDate ? new Date(b.endDate).toLocaleDateString() : "Ongoing"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewId(b.id)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(b)}>
                        {b.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)} disabled={deleting === b.id}>
                        {deleting === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No banners found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-xl rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold">Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setPreviewId(null)}>Close</Button>
            </div>
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: previewBanner.backgroundColor, color: previewBanner.textColor }}
            >
              <h3 className="text-lg font-bold mb-2">{previewBanner.title}</h3>
              <p className="text-sm opacity-90 mb-3">{previewBanner.content}</p>
              {previewBanner.ctaText && (
                <span className="inline-block rounded-full px-4 py-2 text-sm font-medium bg-white/20 backdrop-blur">
                  {previewBanner.ctaText}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingId ? "Edit Banner" : "Create Banner"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      const defaults = typeDefaults[type];
                      setForm((prev) => ({
                        ...prev,
                        type,
                        ...(defaults
                          ? { backgroundColor: defaults.backgroundColor, textColor: defaults.textColor, position: defaults.position }
                          : {}),
                      }));
                    }}
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="banner">Banner</option>
                    <option value="popup">Popup</option>
                    <option value="emergency_appeal">Emergency Appeal</option>
                    <option value="announcement">Announcement</option>
                  </select>
                  {form.type === "emergency_appeal" && (
                    <p className="text-xs text-muted-foreground">
                      Shown as the red header bar site-wide. Set an end date to enable the countdown timer.
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <textarea rows={3} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>CTA Text</Label>
                  <Input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} placeholder="Donate Now" />
                </div>
                <div className="space-y-2">
                  <Label>CTA URL</Label>
                  <Input value={form.ctaUrl} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/donate" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })} className="h-10 w-10 rounded border cursor-pointer" />
                    <Input value={form.backgroundColor} onChange={(e) => setForm({ ...form, backgroundColor: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="h-10 w-10 rounded border cursor-pointer" />
                    <Input value={form.textColor} onChange={(e) => setForm({ ...form, textColor: e.target.value })} className="flex-1" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Banner Image</Label>
                <FilePicker value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} accept="image" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.dismissible} onChange={(e) => setForm({ ...form, dismissible: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
                Visitors can dismiss
              </label>
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

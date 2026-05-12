"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  Save,
  X,
  ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilePicker } from "@/components/ui/file-picker";
import { cn } from "@/lib/utils";
import {
  fetchHeroSlides,
  adminCreateHeroSlide,
  adminUpdateHeroSlide,
  adminDeleteHeroSlide,
} from "@/lib/api";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaUrl: string;
  backgroundImage: string;
  sortOrder: number;
  isVisible: boolean;
}

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<HeroSlide>>({});
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  async function loadSlides() {
    try {
      const data = await fetchHeroSlides();
      setSlides(Array.isArray(data) ? data : data.items || []);
    } catch {
      toast.error("Failed to load hero slides");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlides();
  }, []);

  function startEdit(slide: HeroSlide) {
    setEditing(slide.id);
    setForm({ ...slide });
    setCreating(false);
  }

  function cancelEdit() {
    setEditing(null);
    setForm({});
    setCreating(false);
  }

  async function saveEdit() {
    if (!form.title?.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        subtitle: form.subtitle,
        ctaText: form.ctaText,
        ctaUrl: form.ctaUrl,
        backgroundImage: form.backgroundImage,
        sortOrder: form.sortOrder,
        isVisible: form.isVisible,
      };

      if (creating) {
        await adminCreateHeroSlide(payload);
        toast.success("Slide created");
      } else if (editing) {
        await adminUpdateHeroSlide(editing, payload);
        toast.success("Slide updated");
      }
      cancelEdit();
      await loadSlides();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save slide");
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(slide: HeroSlide) {
    try {
      await adminUpdateHeroSlide(slide.id, { isVisible: !slide.isVisible });
      setSlides((prev) =>
        prev.map((s) =>
          s.id === slide.id ? { ...s, isVisible: !s.isVisible } : s
        )
      );
    } catch {
      toast.error("Failed to update visibility");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this slide?")) return;
    try {
      await adminDeleteHeroSlide(id);
      toast.success("Slide deleted");
      setSlides((prev) => prev.filter((s) => s.id !== id));
      if (editing === id) cancelEdit();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete slide");
    }
  }

  function addSlide() {
    setCreating(true);
    setEditing("new");
    setForm({
      title: "",
      subtitle: "",
      ctaText: "Learn More",
      ctaUrl: "/",
      backgroundImage: "",
      sortOrder: slides.length + 1,
      isVisible: false,
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading hero slides...
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
            Hero Slides Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage homepage hero banner slides
          </p>
        </div>
        <Button onClick={addSlide}>
          <Plus className="h-4 w-4" />
          Add Slide
        </Button>
      </div>

      {creating && editing === "new" && (
        <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <div className="p-5 space-y-4 bg-muted/30">
            <h3 className="font-semibold">New Slide</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CTA Text</Label>
                <Input value={form.ctaText || ""} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CTA URL</Label>
                <Input value={form.ctaUrl || ""} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Background Image</Label>
                <FilePicker value={form.backgroundImage || ""} onChange={(url) => setForm({ ...form, backgroundImage: url })} accept="image" />
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="new-visible" checked={form.isVisible || false} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
              <Label htmlFor="new-visible">Visible</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} size="sm" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Create Slide
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {slides
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((slide) => (
            <div
              key={slide.id}
              className="rounded-2xl border bg-card shadow-soft overflow-hidden"
            >
              <div className="flex items-center gap-4 p-5">
                <GripVertical className="h-5 w-5 text-muted-foreground/50 shrink-0 cursor-grab" />
                <div className="flex h-12 w-20 items-center justify-center rounded-lg bg-muted shrink-0 overflow-hidden">
                  {slide.backgroundImage ? (
                    <img src={slide.backgroundImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{slide.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {slide.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleVisibility(slide)}
                  >
                    {slide.isVisible ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => startEdit(slide)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(slide.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {editing === slide.id && !creating && (
                <>
                  <Separator />
                  <div className="p-5 space-y-4 bg-muted/30">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtitle</Label>
                        <Input value={form.subtitle || ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CTA Text</Label>
                        <Input value={form.ctaText || ""} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CTA URL</Label>
                        <Input value={form.ctaUrl || ""} onChange={(e) => setForm({ ...form, ctaUrl: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Background Image</Label>
                        <FilePicker value={form.backgroundImage || ""} onChange={(url) => setForm({ ...form, backgroundImage: url })} accept="image" />
                      </div>
                      <div className="space-y-2">
                        <Label>Sort Order</Label>
                        <Input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`visible-${slide.id}`} checked={form.isVisible || false} onChange={(e) => setForm({ ...form, isVisible: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
                      <Label htmlFor={`visible-${slide.id}`}>Visible</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveEdit} size="sm" disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Changes
                      </Button>
                      <Button variant="outline" size="sm" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

        {slides.length === 0 && (
          <div className="rounded-2xl border bg-card shadow-soft p-10 text-center text-muted-foreground">
            No hero slides yet. Click &quot;Add Slide&quot; to create one.
          </div>
        )}
      </div>
    </div>
  );
}

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
  HelpCircle,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isPublished: boolean;
}

const emptyForm = {
  question: "",
  answer: "",
  category: "",
  isPublished: true,
};

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadFaqs() {
    try {
      const { data } = await api.get("/admin/cms/faqs");
      setFaqs(data.items || data || []);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFaqs();
  }, []);

  const categories = [...new Set(faqs.map((f) => f.category).filter(Boolean))];
  const filtered = faqs
    .filter((f) => categoryFilter === "all" || f.category === categoryFilter)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const grouped = filtered.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const cat = faq.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {});

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(faq: FAQ) {
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "",
      isPublished: faq.isPublished,
    });
    setEditingId(faq.id);
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.question.trim()) {
      toast.error("Question is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/cms/faqs/${editingId}`, form);
        toast.success("FAQ updated");
      } else {
        await api.post("/admin/cms/faqs", { ...form, sortOrder: faqs.length });
        toast.success("FAQ created");
      }
      setShowModal(false);
      setEditingId(null);
      await loadFaqs();
    } catch {
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    setDeleting(id);
    try {
      await api.delete(`/admin/cms/faqs/${id}`);
      toast.success("FAQ deleted");
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  async function handleReorder(id: string, direction: "up" | "down") {
    const idx = filtered.findIndex((f) => f.id === id);
    if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= filtered.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    try {
      await api.post("/admin/cms/faqs/reorder", {
        items: [
          { id: filtered[idx].id, sortOrder: filtered[swapIdx].sortOrder },
          { id: filtered[swapIdx].id, sortOrder: filtered[idx].sortOrder },
        ],
      });
      await loadFaqs();
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
            <Loader2 className="h-5 w-5 animate-spin" /> Loading FAQs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">FAQs</h1>
          <p className="text-muted-foreground mt-1">Manage frequently asked questions</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add FAQ</Button>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {Object.keys(grouped).length > 0 ? Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="rounded-2xl border bg-card shadow-soft overflow-hidden">
          <div className="px-5 py-3 bg-muted/40">
            <h2 className="font-serif font-bold text-sm">{category}</h2>
          </div>
          <div className="divide-y">
            {items.map((faq) => (
              <div key={faq.id} className={cn("px-5 py-4 hover:bg-muted/20 transition-colors", !faq.isPublished && "opacity-50")}>
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{faq.question}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(faq.id, "up")}>
                      <ChevronUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleReorder(faq.id, "down")}>
                      <ChevronDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(faq)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(faq.id)} disabled={deleting === faq.id}>
                      {deleting === faq.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border bg-card shadow-soft p-8 text-center text-muted-foreground">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No FAQs found
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingId ? "Edit FAQ" : "Add FAQ"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question *</Label>
                <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Answer *</Label>
                <textarea rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Donations, General" list="faq-categories" />
                <datalist id="faq-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
                Published
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { adminCreateFaq, adminDeleteFaq, adminUpdateFaq } from "@/lib/api";
import RichTextEditor from "@/components/admin/RichTextEditor";

function stripHtmlPreview(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

interface FaqItem {
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
  category: "general",
  isPublished: true,
};

export function SettingsFaqPanel() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadFaqs = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/cms/faqs");
      setItems(Array.isArray(data) ? data : data?.items ?? []);
    } catch {
      toast.error("Failed to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: FaqItem) {
    setEditingId(item.id);
    setForm({
      question: item.question,
      answer: item.answer,
      category: item.category || "general",
      isPublished: item.isPublished,
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        category: form.category.trim() || "general",
        isPublished: form.isPublished,
        sortOrder: editingId
          ? items.find((i) => i.id === editingId)?.sortOrder ?? 0
          : items.length,
      };
      if (editingId) {
        await adminUpdateFaq(editingId, payload);
        toast.success("FAQ updated");
      } else {
        await adminCreateFaq(payload);
        toast.success("FAQ created");
      }
      setModalOpen(false);
      await loadFaqs();
    } catch {
      toast.error("Failed to save FAQ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this FAQ?")) return;
    try {
      await adminDeleteFaq(id);
      toast.success("FAQ deleted");
      await loadFaqs();
    } catch {
      toast.error("Failed to delete FAQ");
    }
  }

  async function togglePublished(item: FaqItem) {
    try {
      await adminUpdateFaq(item.id, { isPublished: !item.isPublished });
      await loadFaqs();
    } catch {
      toast.error("Failed to update FAQ");
    }
  }

  async function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    const aOrder = a.sortOrder;
    a.sortOrder = b.sortOrder;
    b.sortOrder = aOrder;
    next[index] = b;
    next[target] = a;
    setItems(next);
    try {
      await Promise.all([
        adminUpdateFaq(a.id, { sortOrder: a.sortOrder }),
        adminUpdateFaq(b.id, { sortOrder: b.sortOrder }),
      ]);
    } catch {
      toast.error("Failed to reorder");
      await loadFaqs();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading FAQs...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-serif font-bold">FAQ Manager</h2>
          <p className="text-sm text-muted-foreground">Published FAQs appear on the homepage.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-xl">
          No FAQs yet. Add one to show the section on the homepage.
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-soft"
            >
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                  aria-label="Move up"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {stripHtmlPreview(item.answer) || "—"}
                </p>
                {item.category && item.category !== "general" && (
                  <span className="inline-block mt-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {item.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublished(item)}
                  aria-label={item.isPublished ? "Unpublish" : "Publish"}
                >
                  {item.isPublished ? (
                    <Eye className="h-4 w-4 text-primary" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Question</Label>
              <Input
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer</Label>
              <RichTextEditor
                value={form.answer}
                onChange={(html) => setForm((p) => ({ ...p, answer: html }))}
                placeholder="Write the answer…"
              />
            </div>
            <div className="space-y-2">
              <Label>Category (optional)</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                placeholder="general"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
              />
              Published on homepage
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

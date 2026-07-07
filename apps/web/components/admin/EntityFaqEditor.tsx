"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Library,
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
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { EntityFaqItem } from "@repo/shared-types";
import { cn } from "@/lib/utils";

interface LibraryFaq {
  id: string;
  question: string;
  answer: string;
  isPublished: boolean;
}

function newFaqId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `faq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function stripPreview(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

type EntityFaqEditorProps = {
  items: EntityFaqItem[];
  onChange: (items: EntityFaqItem[]) => void;
  className?: string;
};

export function EntityFaqEditor({ items, onChange, className }: EntityFaqEditorProps) {
  const [library, setLibrary] = useState<LibraryFaq[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });

  const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const loadLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const { data } = await api.get("/admin/cms/faqs");
      const list = Array.isArray(data) ? data : data?.items ?? [];
      setLibrary(
        list.filter((f: LibraryFaq) => f.isPublished !== false)
      );
    } catch {
      toast.error("Failed to load FAQ library");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (pickerOpen) loadLibrary();
  }, [pickerOpen, loadLibrary]);

  function updateList(next: EntityFaqItem[]) {
    onChange(
      next.map((item, index) => ({ ...item, sortOrder: index }))
    );
  }

  function openCreate() {
    setEditingId(null);
    setForm({ question: "", answer: "" });
    setEditOpen(true);
  }

  function openEdit(item: EntityFaqItem) {
    setEditingId(item.id);
    setForm({ question: item.question, answer: item.answer });
    setEditOpen(true);
  }

  function saveEdit() {
    if (!form.question.trim() || !stripPreview(form.answer)) {
      toast.error("Question and answer are required");
      return;
    }
    if (editingId) {
      updateList(
        items.map((item) =>
          item.id === editingId
            ? { ...item, question: form.question.trim(), answer: form.answer }
            : item
        )
      );
    } else {
      updateList([
        ...items,
        {
          id: newFaqId(),
          question: form.question.trim(),
          answer: form.answer,
          sortOrder: items.length,
          isActive: true,
        },
      ]);
    }
    setEditOpen(false);
  }

  function addFromLibrary(faq: LibraryFaq) {
    if (items.some((i) => i.libraryFaqId === faq.id)) {
      toast.message("FAQ already added");
      return;
    }
    updateList([
      ...items,
      {
        id: newFaqId(),
        question: faq.question,
        answer: faq.answer,
        sortOrder: items.length,
        isActive: true,
        libraryFaqId: faq.id,
      },
    ]);
    toast.success("FAQ added from library");
    setPickerOpen(false);
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const copy = [...sorted];
    const [removed] = copy.splice(index, 1);
    copy.splice(target, 0, removed);
    updateList(copy);
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="font-serif font-semibold text-lg">FAQ</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Frequently asked questions shown on the public page. Only active FAQs appear publicly and in FAQ schema.
        </p>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No FAQs yet. Add common questions to help visitors and improve SEO.
        </div>
      ) : (
        <ul className="space-y-2">
          {sorted.map((item, index) => (
            <li
              key={item.id}
              className="flex items-start gap-2 rounded-xl border bg-card p-3 shadow-sm"
            >
              <div className="flex flex-col gap-0.5 pt-1">
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                  disabled={index === sorted.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{item.question}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {stripPreview(item.answer)}
                </p>
                {item.libraryFaqId && (
                  <span className="mt-1 inline-block text-[10px] uppercase tracking-wide text-primary">
                    From library
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateList(
                      items.map((f) =>
                        f.id === item.id ? { ...f, isActive: !f.isActive } : f
                      )
                    )
                  }
                  title={item.isActive ? "Hide on site" : "Show on site"}
                >
                  {item.isActive ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => updateList(items.filter((f) => f.id !== item.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add FAQ
        </Button>
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
          <Library className="h-4 w-4 mr-2" />
          Choose from library
        </Button>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit FAQ" : "New FAQ"}</DialogTitle>
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
                onChange={(answer) => setForm((p) => ({ ...p, answer }))}
                placeholder="Answer..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={saveEdit}>
              Save FAQ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose from FAQ library</DialogTitle>
          </DialogHeader>
          {libraryLoading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : library.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No published FAQs in Settings → FAQ. Create some there first, or add a custom FAQ.
            </p>
          ) : (
            <ul className="space-y-2">
              {library.map((faq) => (
                <li key={faq.id}>
                  <button
                    type="button"
                    onClick={() => addFromLibrary(faq)}
                    className="w-full rounded-lg border p-3 text-left text-sm hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-medium">{faq.question}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {stripPreview(faq.answer)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

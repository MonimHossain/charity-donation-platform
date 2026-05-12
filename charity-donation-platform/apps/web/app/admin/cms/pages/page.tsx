"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  Loader2,
  GripVertical,
  Type,
  Image,
  Film,
  MousePointer,
  BarChart3,
  Heart,
  Code,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface Block {
  id: string;
  type: string;
  content: Record<string, any>;
  sortOrder: number;
  isVisible: boolean;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  blocks: Block[];
  createdAt: string;
}

const blockTypes = [
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: Image },
  { type: "video", label: "Video", icon: Film },
  { type: "slider", label: "Slider", icon: Layers },
  { type: "cta", label: "Call to Action", icon: MousePointer },
  { type: "stats", label: "Stats", icon: BarChart3 },
  { type: "donation_form", label: "Donation Form", icon: Heart },
  { type: "html", label: "HTML", icon: Code },
];

const blockDefaults: Record<string, Record<string, any>> = {
  text: { heading: "", body: "" },
  image: { url: "", alt: "", caption: "" },
  video: { url: "", title: "" },
  slider: { images: [] },
  cta: { heading: "", buttonText: "", buttonUrl: "", backgroundColor: "#1e40af" },
  stats: { items: [] },
  donation_form: { campaignId: "", title: "Support Our Cause" },
  html: { code: "" },
};

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function PagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [showPageModal, setShowPageModal] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({ title: "", slug: "", status: "draft" });
  const [saving, setSaving] = useState(false);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [blockContent, setBlockContent] = useState<Record<string, any>>({});

  async function loadPages() {
    try {
      const { data } = await api.get("/admin/cms/pages");
      setPages(data.items || data || []);
    } catch {
      toast.error("Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPages();
  }, []);

  function openCreatePage() {
    setPageForm({ title: "", slug: "", status: "draft" });
    setEditingPageId(null);
    setShowPageModal(true);
  }

  function openEditPage(p: Page) {
    setPageForm({ title: p.title, slug: p.slug, status: p.status });
    setEditingPageId(p.id);
    setShowPageModal(true);
  }

  async function handleSavePage() {
    if (!pageForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingPageId) {
        await api.put(`/admin/cms/pages/${editingPageId}`, pageForm);
        toast.success("Page updated");
      } else {
        await api.post("/admin/cms/pages", pageForm);
        toast.success("Page created");
      }
      setShowPageModal(false);
      await loadPages();
    } catch {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePage(id: string) {
    if (!confirm("Delete this page and all its blocks?")) return;
    try {
      await api.delete(`/admin/cms/pages/${id}`);
      toast.success("Page deleted");
      if (selectedPage?.id === id) setSelectedPage(null);
      setPages((prev) => prev.filter((p) => p.id !== id));
    } catch {
      toast.error("Failed to delete page");
    }
  }

  async function addBlock(pageId: string, type: string) {
    try {
      const currentPage = pages.find((p) => p.id === pageId);
      const maxOrder = currentPage?.blocks?.length || 0;
      await api.post(`/admin/cms/pages/${pageId}/blocks`, {
        type,
        content: blockDefaults[type] || {},
        sortOrder: maxOrder,
        isVisible: true,
      });
      toast.success("Block added");
      await loadPages();
      const updated = pages.find((p) => p.id === pageId);
      if (updated) setSelectedPage(updated);
    } catch {
      toast.error("Failed to add block");
    }
  }

  async function toggleBlockVisibility(pageId: string, blockId: string, isVisible: boolean) {
    try {
      await api.put(`/admin/cms/pages/${pageId}/blocks/${blockId}`, { isVisible: !isVisible });
      await loadPages();
    } catch {
      toast.error("Failed to toggle visibility");
    }
  }

  async function reorderBlock(pageId: string, blockId: string, direction: "up" | "down") {
    const page = pages.find((p) => p.id === pageId);
    if (!page) return;
    const blocks = [...page.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = blocks.findIndex((b) => b.id === blockId);
    if ((direction === "up" && idx <= 0) || (direction === "down" && idx >= blocks.length - 1)) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    try {
      await api.post(`/admin/cms/pages/${pageId}/blocks/reorder`, {
        items: [
          { id: blocks[idx].id, sortOrder: blocks[swapIdx].sortOrder },
          { id: blocks[swapIdx].id, sortOrder: blocks[idx].sortOrder },
        ],
      });
      await loadPages();
    } catch {
      toast.error("Failed to reorder");
    }
  }

  async function deleteBlock(pageId: string, blockId: string) {
    if (!confirm("Delete this block?")) return;
    try {
      await api.delete(`/admin/cms/pages/${pageId}/blocks/${blockId}`);
      toast.success("Block deleted");
      await loadPages();
    } catch {
      toast.error("Failed to delete block");
    }
  }

  function openEditBlock(block: Block) {
    setEditingBlock(block);
    setBlockContent(block.content || {});
  }

  async function saveBlockContent() {
    if (!editingBlock || !selectedPage) return;
    setSaving(true);
    try {
      await api.put(`/admin/cms/pages/${selectedPage.id}/blocks/${editingBlock.id}`, { content: blockContent });
      toast.success("Block content saved");
      setEditingBlock(null);
      await loadPages();
    } catch {
      toast.error("Failed to save block");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (selectedPage) {
      const updated = pages.find((p) => p.id === selectedPage.id);
      if (updated) setSelectedPage(updated);
    }
  }, [pages]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading pages...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Page Builder</h1>
          <p className="text-muted-foreground mt-1">Create and manage dynamic pages with content blocks</p>
        </div>
        <Button onClick={openCreatePage}><Plus className="h-4 w-4" /> Create Page</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-serif font-bold text-sm text-muted-foreground uppercase tracking-wider">Pages</h2>
          {pages.length > 0 ? pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPage(p)}
              className={cn(
                "w-full rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md",
                selectedPage?.id === p.id && "ring-2 ring-primary"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm truncate">{p.title}</span>
                <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", statusStyles[p.status] || "bg-slate-100 text-slate-600")}>
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">/{p.slug}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.blocks?.length || 0} blocks</p>
              <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditPage(p); }}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </button>
          )) : (
            <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">No pages yet</div>
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedPage ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-serif font-bold">{selectedPage.title} — Blocks</h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {blockTypes.map((bt) => (
                  <Button key={bt.type} variant="outline" size="sm" onClick={() => addBlock(selectedPage.id, bt.type)}>
                    <bt.icon className="h-3.5 w-3.5" /> {bt.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                {(selectedPage.blocks || []).sort((a, b) => a.sortOrder - b.sortOrder).map((block) => {
                  const bt = blockTypes.find((t) => t.type === block.type);
                  const Icon = bt?.icon || Code;
                  return (
                    <div key={block.id} className={cn("rounded-xl border bg-card p-4 transition-opacity", !block.isVisible && "opacity-50")}>
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium capitalize flex-1">{bt?.label || block.type}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorderBlock(selectedPage.id, block.id, "up")}>
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => reorderBlock(selectedPage.id, block.id, "down")}>
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleBlockVisibility(selectedPage.id, block.id, block.isVisible)}>
                            {block.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBlock(block)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBlock(selectedPage.id, block.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {block.content && (
                        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 max-h-20 overflow-hidden">
                          {JSON.stringify(block.content).substring(0, 200)}...
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!selectedPage.blocks || selectedPage.blocks.length === 0) && (
                  <div className="rounded-xl border-2 border-dashed p-8 text-center text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No blocks yet. Add a block above to get started.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card shadow-soft p-8 text-center text-muted-foreground">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Select a page to manage its content blocks</p>
            </div>
          )}
        </div>
      </div>

      {showPageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingPageId ? "Edit Page" : "Create Page"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowPageModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={pageForm.slug} onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })} placeholder="my-page" />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select value={pageForm.status} onChange={(e) => setPageForm({ ...pageForm, status: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPageModal(false)}>Cancel</Button>
                <Button onClick={handleSavePage} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> {editingPageId ? "Update" : "Create"}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">Edit Block Content</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingBlock(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              {Object.keys(blockContent).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/([A-Z])/g, " $1")}</Label>
                  {typeof blockContent[key] === "string" ? (
                    blockContent[key].length > 100 || key === "body" || key === "code" ? (
                      <textarea
                        rows={4}
                        value={blockContent[key]}
                        onChange={(e) => setBlockContent({ ...blockContent, [key]: e.target.value })}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    ) : (
                      <Input value={blockContent[key]} onChange={(e) => setBlockContent({ ...blockContent, [key]: e.target.value })} />
                    )
                  ) : (
                    <textarea
                      rows={3}
                      value={JSON.stringify(blockContent[key], null, 2)}
                      onChange={(e) => {
                        try { setBlockContent({ ...blockContent, [key]: JSON.parse(e.target.value) }); } catch {}
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}
                </div>
              ))}
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBlock(null)}>Cancel</Button>
                <Button onClick={saveBlockContent} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

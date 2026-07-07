"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";

interface SeoEntry {
  id: string;
  pagePath: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  keywords: string;
  noIndex: boolean;
}

interface Redirect {
  id: string;
  fromUrl: string;
  toUrl: string;
  statusCode: number;
}

const emptyForm = {
  pagePath: "",
  metaTitle: "",
  metaDescription: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  keywords: "",
  noIndex: false,
};

const emptyRedirect = { fromUrl: "", toUrl: "", statusCode: 301 };

export default function SeoPage() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [redirects, setRedirects] = useState<Redirect[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"seo" | "redirects" | "sitemap">("seo");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [redirectForm, setRedirectForm] = useState(emptyRedirect);
  const [showRedirectModal, setShowRedirectModal] = useState(false);
  const [editingRedirectId, setEditingRedirectId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [seoRes, redirectRes] = await Promise.all([
        api.get("/admin/cms/seo").catch(() => ({ data: [] })),
        api.get("/admin/cms/redirects").catch(() => ({ data: [] })),
      ]);
      setEntries(seoRes.data?.items || seoRes.data || []);
      setRedirects(redirectRes.data?.items || redirectRes.data || []);
    } catch {
      toast.error("Failed to load SEO data");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowModal(true);
  }

  function openEdit(entry: SeoEntry) {
    setForm({
      pagePath: entry.pagePath,
      metaTitle: entry.metaTitle || "",
      metaDescription: entry.metaDescription || "",
      ogTitle: entry.ogTitle || "",
      ogDescription: entry.ogDescription || "",
      ogImage: entry.ogImage || "",
      keywords: entry.keywords || "",
      noIndex: entry.noIndex || false,
    });
    setEditingId(entry.id);
    setShowModal(true);
  }

  async function handleSaveSeo() {
    if (!form.pagePath.trim()) {
      toast.error("Page path is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/cms/seo/${editingId}`, form);
        toast.success("SEO entry updated");
      } else {
        await api.post("/admin/cms/seo", form);
        toast.success("SEO entry created");
      }
      setShowModal(false);
      await loadData();
    } catch {
      toast.error("Failed to save SEO entry");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSeo(id: string) {
    if (!confirm("Delete this SEO entry?")) return;
    try {
      await api.delete(`/admin/cms/seo/${id}`);
      toast.success("Deleted");
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  }

  function openCreateRedirect() {
    setRedirectForm(emptyRedirect);
    setEditingRedirectId(null);
    setShowRedirectModal(true);
  }

  function openEditRedirect(r: Redirect) {
    setRedirectForm({ fromUrl: r.fromUrl, toUrl: r.toUrl, statusCode: r.statusCode });
    setEditingRedirectId(r.id);
    setShowRedirectModal(true);
  }

  async function handleSaveRedirect() {
    if (!redirectForm.fromUrl || !redirectForm.toUrl) {
      toast.error("Both URLs are required");
      return;
    }
    setSaving(true);
    try {
      if (editingRedirectId) {
        await api.put(`/admin/cms/redirects/${editingRedirectId}`, redirectForm);
        toast.success("Redirect updated");
      } else {
        await api.post("/admin/cms/redirects", redirectForm);
        toast.success("Redirect created");
      }
      setShowRedirectModal(false);
      await loadData();
    } catch {
      toast.error("Failed to save redirect");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRedirect(id: string) {
    if (!confirm("Delete this redirect?")) return;
    try {
      await api.delete(`/admin/cms/redirects/${id}`);
      toast.success("Deleted");
      setRedirects((prev) => prev.filter((r) => r.id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card shadow-soft p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading SEO settings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">SEO Management</h1>
        <p className="text-muted-foreground mt-1">Manage meta tags, redirects and sitemap settings</p>
      </div>

      <div className="flex items-center gap-1 rounded-lg border bg-card p-1 w-fit">
        {(["seo", "redirects", "sitemap"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
            {t === "seo" ? "Meta Tags" : t === "redirects" ? "Redirects" : "Sitemap"}
          </button>
        ))}
      </div>

      {tab === "seo" && (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreate}><Plus className="h-4 w-4" /> Add SEO Entry</Button>
          </div>
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Page Path</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Meta Title</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">No-Index</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length > 0 ? entries.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium font-mono text-xs">{e.pagePath}</td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[300px] truncate">{e.metaTitle || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${e.noIndex ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {e.noIndex ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSeo(e.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No SEO entries</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "redirects" && (
        <>
          <div className="flex justify-end">
            <Button onClick={openCreateRedirect}><Plus className="h-4 w-4" /> Add Redirect</Button>
          </div>
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">From URL</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground"></th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">To URL</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {redirects.length > 0 ? redirects.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs">{r.fromUrl}</td>
                      <td className="px-1 py-3"><ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /></td>
                      <td className="px-5 py-3 font-mono text-xs">{r.toUrl}</td>
                      <td className="px-5 py-3 text-muted-foreground">{r.statusCode}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditRedirect(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRedirect(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No redirects</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "sitemap" && (
        <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
          <h2 className="text-lg font-serif font-bold">Sitemap</h2>
          <p className="text-sm text-muted-foreground">
            The sitemap is generated automatically by Next.js at{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/sitemap.xml</code> and includes
            static pages, published campaigns, and blog posts. Search engines are directed via{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/robots.txt</code>.
          </p>
          <p className="text-sm text-muted-foreground">
            Default change frequency for dynamic URLs is weekly; homepage is refreshed daily.
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingId ? "Edit SEO Entry" : "Add SEO Entry"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Page Path *</Label>
                <Input value={form.pagePath} onChange={(e) => setForm({ ...form, pagePath: e.target.value })} placeholder="/about, /campaigns, /" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>OG Title</Label>
                  <Input value={form.ogTitle} onChange={(e) => setForm({ ...form, ogTitle: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <textarea rows={2} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label>OG Description</Label>
                <textarea rows={2} value={form.ogDescription} onChange={(e) => setForm({ ...form, ogDescription: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Keywords (comma-separated)</Label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} placeholder="charity, donation, help" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.noIndex} onChange={(e) => setForm({ ...form, noIndex: e.target.checked })} className="h-4 w-4 rounded border-input accent-primary" />
                No-Index (prevent search engines from indexing)
              </label>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleSaveSeo} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> {editingId ? "Update" : "Create"}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRedirectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-lg m-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-serif font-bold">{editingRedirectId ? "Edit Redirect" : "Add Redirect"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowRedirectModal(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From URL *</Label>
                <Input value={redirectForm.fromUrl} onChange={(e) => setRedirectForm({ ...redirectForm, fromUrl: e.target.value })} placeholder="/old-page" />
              </div>
              <div className="space-y-2">
                <Label>To URL *</Label>
                <Input value={redirectForm.toUrl} onChange={(e) => setRedirectForm({ ...redirectForm, toUrl: e.target.value })} placeholder="/new-page" />
              </div>
              <div className="space-y-2">
                <Label>Status Code</Label>
                <select value={redirectForm.statusCode} onChange={(e) => setRedirectForm({ ...redirectForm, statusCode: Number(e.target.value) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                  <option value={301}>301 (Permanent)</option>
                  <option value={302}>302 (Temporary)</option>
                </select>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRedirectModal(false)}>Cancel</Button>
                <Button onClick={handleSaveRedirect} disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> {editingRedirectId ? "Update" : "Create"}</>}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

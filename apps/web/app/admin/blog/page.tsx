"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Search, X, Save, Loader2, ArrowLeft, Eye, Calendar, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FilePicker } from "@/components/ui/file-picker";
import { cn } from "@/lib/utils";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  fetchAdminBlogPosts,
  fetchAdminBlogPost,
  adminCreateBlogPost,
  adminUpdateBlogPost,
  adminDeleteBlogPost,
  fetchAdminBlogCategories,
} from "@/lib/api";

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  author?: string;
  tags?: string[];
  categoryId?: string | null;
  categoryName?: string | null;
  status?: string;
  isFeatured?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const statusStyles: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-slate-100 text-slate-600",
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const [view, setView] = useState<"list" | "editor">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [loadingPost, setLoadingPost] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugLocked, setSlugLocked] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Editorial Team");
  const [featuredImage, setFeaturedImage] = useState("");
  const [status, setStatus] = useState("draft");
  const [isFeatured, setIsFeatured] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    fetchAdminBlogCategories()
      .then((items) => setCategories(items))
      .catch(() => setCategories([]));
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await fetchAdminBlogPosts(params);
      setPosts(data.items || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPosts(); }, [page, statusFilter]);

  function resetForm() {
    setTitle(""); setSlug(""); setSlugLocked(false); setExcerpt(""); setContent("");
    setAuthor("Editorial Team"); setFeaturedImage(""); setStatus("draft"); setIsFeatured(false);
    setMetaTitle(""); setMetaDescription(""); setPublishedAt(""); setTags([]); setTagDraft("");
    setCategoryId("");
  }

  function openCreate() {
    resetForm();
    setEditingId(null);
    setView("editor");
  }

  async function openEdit(id: string) {
    setEditingId(id);
    setLoadingPost(true);
    setView("editor");
    try {
      const p = await fetchAdminBlogPost(id);
      setTitle(p.title || "");
      setSlug(p.slug || "");
      setSlugLocked(true);
      setExcerpt(p.excerpt || "");
      setContent(p.content || "");
      setAuthor(p.author || "Editorial Team");
      setFeaturedImage(p.featuredImage || "");
      setStatus(p.status || "draft");
      setIsFeatured(p.isFeatured || false);
      setMetaTitle(p.metaTitle || "");
      setMetaDescription(p.metaDescription || "");
      setPublishedAt(p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 16) : "");
      setTags(p.tags || []);
      setCategoryId(p.categoryId || "");
    } catch {
      toast.error("Failed to load post");
      setView("list");
    } finally {
      setLoadingPost(false);
    }
  }

  useEffect(() => {
    if (!slugLocked) setSlug(slugify(title));
  }, [title, slugLocked]);

  function addTag() {
    const trimmed = tagDraft.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) setTags((prev) => [...prev, trimmed]);
    setTagDraft("");
  }

  async function handleSave() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const normalizedSlug = slugify(slug.trim() || title.trim());
    if (!normalizedSlug) { toast.error("Slug is required"); return; }
    const plainContent = content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
    if (!plainContent) { toast.error("Content is required"); return; }

    setSaving(true);
    const resolvedPublishedAt = publishedAt
      ? new Date(publishedAt).toISOString()
      : status === "published" ? new Date().toISOString() : null;

    const payload = {
      title: title.trim(),
      slug: normalizedSlug,
      excerpt: excerpt.trim() || undefined,
      content,
      featuredImage: featuredImage.trim() || undefined,
      author: author.trim() || "Editorial Team",
      tags: tags.length ? tags : [],
      categoryId: categoryId || null,
      status,
      isFeatured,
      metaTitle: metaTitle.trim() || undefined,
      metaDescription: metaDescription.trim() || undefined,
      publishedAt: resolvedPublishedAt,
    };

    try {
      if (editingId) {
        await adminUpdateBlogPost(editingId, payload);
        toast.success("Post updated");
      } else {
        await adminCreateBlogPost(payload);
        toast.success("Post created");
      }
      setView("list");
      resetForm();
      setEditingId(null);
      await loadPosts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeleting(id);
    try {
      await adminDeleteBlogPost(id);
      toast.success("Post deleted");
      if (view === "editor") { setView("list"); resetForm(); setEditingId(null); }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete post");
    } finally {
      setDeleting(null);
    }
  }

  const totalPages = Math.ceil(total / 20);

  // ─── LIST VIEW ──────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">Blog Posts</h1>
            <p className="text-muted-foreground mt-1">Manage articles and stories</p>
          </div>
          <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Create Post</Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { setPage(1); loadPosts(); } }}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-card shadow-soft p-8">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />Loading blog posts...
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Title</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Featured</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Author</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Tags</th>
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-medium max-w-[280px] truncate">
                        <button onClick={() => openEdit(p.id)} className="hover:text-primary underline-offset-2 hover:underline text-left">
                          {p.title}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.categoryName || "—"}</td>
                      <td className="px-5 py-3">
                        {p.isFeatured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[p.status || "draft"] || "bg-slate-100 text-slate-600")}>
                          {p.status || "draft"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{p.author || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">{(p.tags || []).join(", ") || "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {p.status === "published" && (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="h-3.5 w-3.5" /></Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p.id)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)} disabled={deleting === p.id}>
                            {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">No posts found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-5 py-3">
                <p className="text-sm text-muted-foreground">{total} post{total !== 1 && "s"}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                  <span className="flex items-center px-3 text-sm text-muted-foreground">{page} / {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── EDITOR VIEW ─────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setView("list"); resetForm(); setEditingId(null); }}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-serif">{editingId ? "Edit Blog Post" : "New Blog Post"}</h1>
          <p className="text-sm text-muted-foreground">Build a compelling article with rich content.</p>
        </div>
      </div>

      {loadingPost ? (
        <div className="rounded-2xl border bg-card p-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading post...
        </div>
      ) : (
        <>
          {/* Post Details Card */}
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-5">
            <h2 className="text-sm font-semibold">Post Details</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input value={title} onChange={(e) => { setTitle(e.target.value); }} placeholder="My Amazing Article" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => { setSlugLocked(true); setSlug(slugify(e.target.value)); }}
                  placeholder="my-amazing-article"
                />
                <p className="text-[11px] text-muted-foreground">
                  Public URL: /blog/{slug || "your-slug"}
                  {!slugLocked && title && (
                    <span className="ml-1 text-accent-deep">· auto-generated from title</span>
                  )}
                </p>
                {slugLocked && (
                  <button
                    type="button"
                    className="text-[11px] text-primary hover:underline"
                    onClick={() => {
                      setSlugLocked(false);
                      setSlug(slugify(title));
                    }}
                  >
                    Regenerate from title
                  </button>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Author</Label>
                <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Editorial Team" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Category</Label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Published Date</Label>
                <Input type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                <p className="text-[11px] text-muted-foreground">Leave empty to auto-assign when publishing.</p>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Excerpt</Label>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Short summary for listing pages."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Featured Image</Label>
                <FilePicker value={featuredImage} onChange={setFeaturedImage} accept="image" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>Add</Button>
                </div>
                {tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                        className="rounded-full border bg-muted px-3 py-1 text-xs font-medium hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        {tag} <X className="inline h-3 w-3 ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} className="h-4 w-4 rounded border-input accent-primary" />
                  Featured post
                </label>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">Meta Title (SEO)</Label>
                <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} placeholder="SEO title" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Meta Description (SEO)</Label>
                <Input value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} placeholder="SEO description" />
              </div>
            </div>
          </div>

          {/* Content Editor Card */}
          <div className="rounded-2xl border bg-card shadow-soft p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Article Content *</h2>
              <p className="text-xs text-muted-foreground">Use the rich text editor to format headings, lists, quotes, images, and links.</p>
            </div>
            <RichTextEditor value={content} onChange={setContent} placeholder="Write the full blog content here." />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setView("list"); resetForm(); setEditingId(null); }}>Cancel</Button>
              {editingId && (
                <Button variant="outline" className="text-destructive border-destructive" onClick={() => handleDelete(editingId)} disabled={deleting === editingId}>
                  {deleting === editingId ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Post
                </Button>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Saving...</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" />{editingId ? "Update Post" : "Create Post"}</span>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

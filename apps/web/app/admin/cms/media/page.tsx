"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Upload,
  Trash2,
  Copy,
  FolderOpen,
  FolderPlus,
  Image,
  Film,
  FileText,
  Loader2,
  Grid3X3,
  List,
  Search,
  X,
  ChevronRight,
  Download,
  Move,
  Tag,
  Filter,
  CheckSquare,
  Square,
  MoreHorizontal,
  HardDrive,
  ArrowUpDown,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { api } from "@/lib/api";

interface MediaFile {
  id: string;
  name: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  folder: string;
  tags?: string[];
  uploadedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

type ViewMode = "grid" | "list";
type SortBy = "newest" | "oldest" | "name" | "size";
type FilterType = "all" | "image" | "video" | "document";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Film;
  return FileText;
}

function getFileExtension(name: string) {
  return name.split(".").pop()?.toUpperCase() || "";
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [currentFolder, setCurrentFolder] = useState("/");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("newest");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [editingAlt, setEditingAlt] = useState(false);
  const [altText, setAltText] = useState("");
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "30", sort: sortBy };
      if (currentFolder && currentFolder !== "/") params.folder = currentFolder;
      if (search) params.search = search;
      if (filterType !== "all") params.mimeType = filterType;

      const { data } = await api.get("/admin/cms/media", { params });
      setFiles(data.items || []);
      setFolders(data.folders || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  }, [currentFolder, page, sortBy, search, filterType]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    const totalFiles = fileList.length;
    let completed = 0;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const formData = new FormData();
        formData.append("file", fileList[i]);
        formData.append("folder", currentFolder === "/" ? "/" : currentFolder);
        await api.post("/admin/cms/media/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        completed++;
        setUploadProgress(Math.round((completed / totalFiles) * 100));
      }
      toast.success(`${totalFiles} file(s) uploaded successfully`);
      await loadFiles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to upload file(s)");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await api.delete(`/admin/cms/media/${id}`);
      toast.success("File deleted");
      if (selectedFile?.id === id) setSelectedFile(null);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch {
      toast.error("Failed to delete file");
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected file(s)?`)) return;
    try {
      await api.post("/admin/cms/media/bulk-delete", { ids: Array.from(selectedIds) });
      toast.success(`${selectedIds.size} file(s) deleted`);
      setSelectedIds(new Set());
      setSelectedFile(null);
      await loadFiles();
    } catch {
      toast.error("Failed to delete files");
    }
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) return;
    try {
      await api.post("/admin/cms/media/folders", {
        name: newFolderName.trim(),
        parent: currentFolder,
      });
      toast.success("Folder created");
      setShowNewFolder(false);
      setNewFolderName("");
      await loadFiles();
    } catch {
      toast.error("Failed to create folder");
    }
  }

  async function handleMove(targetFolder: string) {
    try {
      await api.post("/admin/cms/media/move", {
        ids: Array.from(selectedIds),
        targetFolder,
      });
      toast.success(`Moved ${selectedIds.size} file(s)`);
      setShowMoveModal(false);
      setSelectedIds(new Set());
      await loadFiles();
    } catch {
      toast.error("Failed to move files");
    }
  }

  async function handleUpdateFile(id: string, updates: Record<string, any>) {
    try {
      const { data } = await api.put(`/admin/cms/media/${id}`, updates);
      setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...data } : f)));
      if (selectedFile?.id === id) setSelectedFile({ ...selectedFile, ...data });
      toast.success("File updated");
    } catch {
      toast.error("Failed to update file");
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  }

  function navigateToFolder(folder: string) {
    setCurrentFolder(folder);
    setPage(1);
    setSelectedIds(new Set());
    setSelectedFile(null);
  }

  const breadcrumbs = currentFolder === "/" ? [] : currentFolder.split("/").filter(Boolean);
  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">File Manager</h1>
          <p className="text-muted-foreground mt-1">{total} files &middot; Drag &amp; drop to upload</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip" onChange={(e) => handleUpload(e.target.files)} />
          <Button variant="outline" size="sm" onClick={() => setShowNewFolder(true)}>
            <FolderPlus className="h-4 w-4" /> New Folder
          </Button>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {uploadProgress}%</>
            ) : (
              <><Upload className="h-4 w-4" /> Upload Files</>
            )}
          </Button>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        className={cn(
          "rounded-2xl border-2 border-dashed p-6 text-center transition-all",
          dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-muted-foreground/40"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
        <p className="text-sm text-muted-foreground">Drop files here or click Upload</p>
        <p className="text-[10px] text-muted-foreground mt-1">Max 50MB per file &middot; Images, videos, documents</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-sm">
            <button onClick={() => navigateToFolder("/")} className={cn("hover:underline font-medium", currentFolder === "/" ? "text-foreground" : "text-primary")}>
              <HardDrive className="h-3.5 w-3.5 inline mr-1" />Root
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <button
                  onClick={() => navigateToFolder(breadcrumbs.slice(0, idx + 1).join("/"))}
                  className={cn("hover:underline", idx === breadcrumbs.length - 1 ? "text-foreground font-medium" : "text-primary")}
                >
                  {crumb}
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk actions */}
          {hasSelection && (
            <div className="flex items-center gap-2 mr-2 px-3 py-1 rounded-lg bg-primary/10 text-sm">
              <span className="font-medium text-primary">{selectedIds.size} selected</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowMoveModal(true)} title="Move">
                <Move className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleBulkDelete} title="Delete">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedIds(new Set())} title="Clear">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Filter */}
          <select value={filterType} onChange={(e) => { setFilterType(e.target.value as FilterType); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="all">All Files</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="document">Documents</option>
          </select>

          {/* Sort */}
          <select value={sortBy} onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }} className="h-9 rounded-md border border-input bg-background px-2 text-xs">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="size">Largest</option>
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-8 h-9 w-44 text-xs" />
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={cn("p-1.5", viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={cn("p-1.5", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Folders */}
      {folders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {folders.filter((f) => f !== currentFolder).map((folder) => (
            <button key={folder} onClick={() => navigateToFolder(folder)} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-muted/80 transition-colors shadow-sm">
              <FolderOpen className="h-4 w-4 text-amber-500" />
              <span className="font-medium">{folder.split("/").pop()}</span>
            </button>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="flex items-center gap-2 p-3 rounded-xl border bg-card">
          <FolderPlus className="h-4 w-4 text-amber-500" />
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" className="h-8 flex-1 max-w-xs" onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()} autoFocus />
          <Button size="sm" onClick={handleCreateFolder}>Create</Button>
          <Button size="sm" variant="ghost" onClick={() => { setShowNewFolder(false); setNewFolderName(""); }}>Cancel</Button>
        </div>
      )}

      {/* File Grid/List */}
      {loading ? (
        <div className="rounded-2xl border bg-card shadow-soft p-12 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading files...
        </div>
      ) : (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {files.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {files.map((file) => {
                    const Icon = getIcon(file.type);
                    const isImage = file.type.startsWith("image/");
                    const isSelected = selectedIds.has(file.id);
                    return (
                      <div
                        key={file.id}
                        className={cn(
                          "group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md cursor-pointer",
                          selectedFile?.id === file.id && "ring-2 ring-primary",
                          isSelected && "ring-2 ring-blue-500 bg-blue-50/50"
                        )}
                        onClick={() => setSelectedFile(file)}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}
                          className={cn("absolute top-2 left-2 z-10 transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}
                        >
                          {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500 fill-blue-100" /> : <Square className="h-5 w-5 text-white drop-shadow-md" />}
                        </button>
                        <div className="aspect-square bg-muted/50 flex items-center justify-center overflow-hidden">
                          {isImage ? (
                            <img src={resolveMediaUrl(file.url) ?? file.url} alt={file.alt || file.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Icon className="h-8 w-8 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground font-medium">{getFileExtension(file.name)}</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-3 py-2 text-left w-8">
                          <button onClick={toggleSelectAll}>
                            {selectedIds.size === files.length ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">File</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Type</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Size</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground text-xs">Uploaded</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file) => {
                        const Icon = getIcon(file.type);
                        const isSelected = selectedIds.has(file.id);
                        return (
                          <tr key={file.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer", isSelected && "bg-blue-50/50")} onClick={() => setSelectedFile(file)}>
                            <td className="px-3 py-2">
                              <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.id); }}>
                                {isSelected ? <CheckSquare className="h-4 w-4 text-blue-500" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                {file.type.startsWith("image/") ? (
                                  <img src={resolveMediaUrl(file.url) ?? file.url} alt="" className="h-8 w-8 rounded object-cover" />
                                ) : (
                                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Icon className="h-4 w-4 text-muted-foreground" /></div>
                                )}
                                <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{getFileExtension(file.name)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{formatSize(file.size)}</td>
                            <td className="px-3 py-2 text-muted-foreground text-xs">{new Date(file.createdAt).toLocaleDateString()}</td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); copyUrl(file.url); }}><Copy className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <div className="rounded-2xl border bg-card shadow-soft p-12 text-center text-muted-foreground">
                <Grid3X3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No files found</p>
                <p className="text-sm mt-1">Upload files or change your search filters</p>
              </div>
            )}

            {/* Pagination */}
            {total > 30 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {Math.ceil(total / 30)}</span>
                <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </div>

          {/* Detail Sidebar */}
          {selectedFile && (
            <div className="w-72 shrink-0 rounded-2xl border bg-card shadow-soft p-4 space-y-4 self-start sticky top-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-sm">File Details</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedFile(null)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="aspect-square rounded-lg bg-muted/50 overflow-hidden flex items-center justify-center">
                {selectedFile.type.startsWith("image/") ? (
                  <img src={resolveMediaUrl(selectedFile.url) ?? selectedFile.url} alt={selectedFile.alt || selectedFile.name} className="w-full h-full object-contain" />
                ) : selectedFile.type.startsWith("video/") ? (
                  <video src={selectedFile.url} controls className="w-full h-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-12 w-12 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">{getFileExtension(selectedFile.name)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium truncate ml-2 max-w-[140px]" title={selectedFile.name}>{selectedFile.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{formatSize(selectedFile.size)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{selectedFile.type}</span></div>
                {selectedFile.width && selectedFile.height && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Dimensions</span><span>{selectedFile.width} × {selectedFile.height}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Folder</span><span>{selectedFile.folder}</span></div>
                {selectedFile.uploadedBy && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Uploaded by</span><span className="truncate ml-2">{selectedFile.uploadedBy}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(selectedFile.createdAt).toLocaleString()}</span></div>
              </div>

              <Separator />

              {/* Alt text */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Alt Text</Label>
                {editingAlt ? (
                  <div className="flex gap-1">
                    <Input value={altText} onChange={(e) => setAltText(e.target.value)} className="h-7 text-xs" />
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={() => { handleUpdateFile(selectedFile.id, { alt: altText }); setEditingAlt(false); }}>Save</Button>
                  </div>
                ) : (
                  <button onClick={() => { setAltText(selectedFile.alt || ""); setEditingAlt(true); }} className="text-xs text-primary hover:underline">
                    {selectedFile.alt || "Add alt text..."}
                  </button>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Tags</Label>
                <div className="flex flex-wrap gap-1">
                  {(selectedFile.tags || []).map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                      {tag}
                      <button onClick={() => handleUpdateFile(selectedFile.id, { tags: (selectedFile.tags || []).filter((t) => t !== tag) })} className="hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                {editingTags ? (
                  <div className="flex gap-1">
                    <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} className="h-7 text-xs" placeholder="Tag name" onKeyDown={(e) => {
                      if (e.key === "Enter" && tagInput.trim()) {
                        handleUpdateFile(selectedFile.id, { tags: [...(selectedFile.tags || []), tagInput.trim()] });
                        setTagInput("");
                      }
                    }} />
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingTags(false)}>Done</Button>
                  </div>
                ) : (
                  <button onClick={() => setEditingTags(true)} className="text-[10px] text-primary hover:underline">+ Add tag</button>
                )}
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-1.5">
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" onClick={() => copyUrl(selectedFile.url)}>
                  <Copy className="h-3 w-3" /> Copy URL
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs" asChild>
                  <a href={selectedFile.url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-3 w-3" /> Open in New Tab
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start h-8 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(selectedFile.id)}>
                  <Trash2 className="h-3 w-3" /> Delete File
                </Button>
              </div>

              {/* URL display */}
              <div className="p-2 rounded-lg bg-muted/50">
                <p className="text-[10px] text-muted-foreground mb-1">File URL</p>
                <p className="text-[10px] break-all font-mono select-all">{selectedFile.url}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-lg m-4 p-6">
            <h3 className="font-serif font-bold text-lg mb-4">Move {selectedIds.size} file(s)</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <button onClick={() => handleMove("/")} className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-sm text-left">
                <HardDrive className="h-4 w-4" /> Root
              </button>
              {folders.map((f) => (
                <button key={f} onClick={() => handleMove(f)} className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-muted text-sm text-left">
                  <FolderOpen className="h-4 w-4 text-amber-500" /> {f}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowMoveModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

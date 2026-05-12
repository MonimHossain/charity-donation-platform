"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Upload,
  Image,
  Film,
  FileText,
  X,
  Search,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface PickedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FilePickerProps {
  value?: string;
  onChange: (url: string, file?: PickedFile) => void;
  accept?: "image" | "video" | "document" | "all";
  label?: string;
  className?: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilePicker({ value, onChange, accept = "all", label, className }: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadFiles() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "40" };
      if (search) params.search = search;
      if (accept !== "all") params.mimeType = accept;
      const { data } = await api.get("/admin/cms/media", { params });
      setFiles((data.items || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        type: f.type,
        size: f.size,
      })));
    } catch {
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadFiles();
  }, [open, search]);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", fileList[0]);
      const { data } = await api.post("/admin/cms/media/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url, { id: data.id, name: data.name, url: data.url, type: data.type, size: data.size });
      setOpen(false);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const acceptAttr = accept === "image" ? "image/*" : accept === "video" ? "video/*" : undefined;

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}

      {value ? (
        <div className="relative group rounded-lg border bg-muted/30 overflow-hidden">
          {value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
            <img src={value} alt="" className="w-full h-32 object-cover" />
          ) : (
            <div className="h-32 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>Change</Button>
            <Button size="sm" variant="secondary" onClick={() => onChange("")}>
              <X className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground p-1 truncate">{value.split("/").pop()}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Choose file</span>
        </button>
      )}

      {/* Picker Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="w-full max-w-3xl max-h-[80vh] rounded-2xl border bg-card shadow-lg m-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-serif font-bold">Select File</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 h-8 w-48 text-xs" />
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept={acceptAttr} onChange={(e) => handleUpload(e.target.files)} />
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload New
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
                </div>
              ) : files.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {files.map((file) => {
                    const isImage = file.type.startsWith("image/");
                    const isActive = value === file.url;
                    return (
                      <button
                        key={file.id}
                        onClick={() => { onChange(file.url, file); setOpen(false); }}
                        className={cn(
                          "relative rounded-lg border overflow-hidden transition-all hover:shadow-md",
                          isActive && "ring-2 ring-primary"
                        )}
                      >
                        <div className="aspect-square bg-muted/50 flex items-center justify-center">
                          {isImage ? (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : file.type.startsWith("video/") ? (
                            <Film className="h-6 w-6 text-muted-foreground" />
                          ) : (
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        {isActive && (
                          <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-foreground" />
                          </div>
                        )}
                        <p className="text-[10px] p-1 truncate">{file.name}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">No files found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Upload,
  Image as ImageIcon,
  X,
  Search,
  Loader2,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, imageAltFromSrc } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { uploadMediaFile, type UploadedMediaFile } from "@/lib/media-upload";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ImageSliderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (images: string[]) => void;
}

export function ImageSliderDialog({ open, onOpenChange, onConfirm }: ImageSliderDialogProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSearch("");
      return;
    }
    void loadFiles();
  }, [open, search]);

  async function loadFiles() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "60", mimeType: "image" };
      if (search) params.search = search;
      const { data } = await api.get("/admin/cms/media", { params });
      setFiles(
        (data.items || []).map((f: MediaFile) => ({
          id: f.id,
          name: f.name,
          url: f.url,
          type: f.type,
          size: f.size,
        }))
      );
    } catch {
      toast.error("Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  function toggleUrl(url: string) {
    const resolved = resolveMediaUrl(url) ?? url;
    setSelected((prev) =>
      prev.includes(resolved) ? prev.filter((u) => u !== resolved) : [...prev, resolved]
    );
  }

  function moveSelected(idx: number, dir: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[idx]!;
      next[idx] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }

  function removeAt(idx: number) {
    setSelected((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleUpload(fileList: FileList | null) {
    if (!fileList?.length) return;
    setUploading(true);
    try {
      const added: string[] = [];
      for (const file of Array.from(fileList)) {
        if (!file.type.startsWith("image/")) continue;
        const uploaded: UploadedMediaFile = await uploadMediaFile(file);
        const url = resolveMediaUrl(uploaded.url) ?? uploaded.url;
        added.push(url);
      }
      if (added.length === 0) {
        toast.error("Please upload image files only");
        return;
      }
      setSelected((prev) => [...prev, ...added]);
      toast.success(added.length === 1 ? "Image uploaded" : `${added.length} images uploaded`);
      void loadFiles();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current += 1;
    setDragOver(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current -= 1;
    if (dragDepth.current <= 0) {
      dragDepth.current = 0;
      setDragOver(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragOver(false);
    void handleUpload(e.dataTransfer.files);
  }

  function handleConfirm() {
    if (selected.length < 2) {
      toast.error("Select at least 2 images for a slider");
      return;
    }
    onConfirm(selected);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert image slider</DialogTitle>
          <DialogDescription>
            Pick at least 2 images. Reorder them below before inserting.
          </DialogDescription>
        </DialogHeader>

        {selected.length > 0 && (
          <div className="rounded-lg border bg-muted/30 p-3 space-y-2 max-h-40 overflow-y-auto">
            <p className="text-xs font-semibold text-muted-foreground">
              Selected ({selected.length}) — top appears first
            </p>
            {selected.map((url, idx) => (
              <div key={`${url}-${idx}`} className="flex items-center gap-2">
                <img src={url} alt={imageAltFromSrc(url)} className="h-10 w-14 rounded object-cover shrink-0" />
                <span className="text-xs truncate flex-1 min-w-0">{url.split("/").pop()}</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === 0}
                  onClick={() => moveSelected(idx, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  disabled={idx === selected.length - 1}
                  onClick={() => moveSelected(idx, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeAt(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search library..."
              className="pl-8 h-9 text-sm"
            />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => void handleUpload(e.target.files)}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload
          </Button>
        </div>

        <div
          className={cn(
            "rounded-xl border-2 border-dashed px-4 py-4 text-center text-sm text-muted-foreground",
            dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          )}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          Drag & drop images here (multi-file supported)
        </div>

        <div className="flex-1 min-h-[200px] overflow-y-auto border rounded-lg p-3">
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground text-sm">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {files.map((file) => {
                const url = resolveMediaUrl(file.url) ?? file.url;
                const isOn = selected.includes(url);
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => toggleUrl(file.url)}
                    className={cn(
                      "relative rounded-lg border overflow-hidden text-left hover:shadow-md",
                      isOn && "ring-2 ring-primary"
                    )}
                  >
                    <div className="aspect-square bg-muted">
                      <img src={url} alt={imageAltFromSrc(url) || file.name} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    {isOn && (
                      <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <ImageIcon className="h-8 w-8 mx-auto opacity-40 mb-2" />
              No images in library yet.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={selected.length < 2}>
            Insert slider ({selected.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

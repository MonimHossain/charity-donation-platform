"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Upload, Image, Film, FileText, X, Search, Loader2, Check } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn, imageAltFromSrc } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/campaign-media";
import {
  matchesMediaAccept,
  mediaAcceptAttribute,
  uploadMediaFile,
  type UploadedMediaFile,
} from "@/lib/media-upload";

interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accept?: "image" | "video" | "document" | "all";
  onSelect: (url: string, file?: MediaFile) => void;
  selectedUrl?: string;
  title?: string;
}

export function MediaPickerDialog({
  open,
  onOpenChange,
  accept = "all",
  onSelect,
  selectedUrl,
  title = "Select file",
}: MediaPickerDialogProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  async function loadFiles() {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: "40" };
      if (search) params.search = search;
      if (accept !== "all") params.mimeType = accept;
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
      toast.error("Failed to load files");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadFiles();
  }, [open, search, accept]);

  async function handleUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!matchesMediaAccept(file, accept)) {
      toast.error(
        accept === "image"
          ? "Please upload an image file"
          : accept === "video"
          ? "Please upload a video file"
          : "This file type is not supported here"
      );
      return;
    }

    setUploading(true);
    try {
      const uploaded: UploadedMediaFile = await uploadMediaFile(file);
      onSelect(uploaded.url, uploaded);
      onOpenChange(false);
      toast.success("File uploaded");
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

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragOver(false);
    void handleUpload(e.dataTransfer.files);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-3xl max-h-[80vh] rounded-2xl border bg-card shadow-lg m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b gap-3">
          <h3 className="font-serif font-bold shrink-0">{title}</h3>
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 h-8 w-48 text-xs"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={mediaAcceptAttribute(accept)}
              onChange={(e) => handleUpload(e.target.files)}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              Upload from device
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "mx-4 mt-4 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-all",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-muted-foreground/40"
          )}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </div>
          ) : (
            <>
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm text-muted-foreground">
                {dragOver ? "Drop file to upload" : "Drag & drop a file here"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">or use Upload from device above</p>
            </>
          )}
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
                const isActive = selectedUrl === file.url;
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => {
                      onSelect(resolveMediaUrl(file.url) ?? file.url, file);
                      onOpenChange(false);
                    }}
                    className={cn(
                      "relative rounded-lg border overflow-hidden transition-all hover:shadow-md text-left",
                      isActive && "ring-2 ring-primary"
                    )}
                  >
                    <div className="aspect-square bg-muted/50 flex items-center justify-center">
                      {isImage ? (
                        <img
                          src={resolveMediaUrl(file.url) ?? file.url}
                          alt={imageAltFromSrc(file.url) || file.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
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
            <div className="text-center py-8 text-muted-foreground text-sm space-y-3">
              <div className="flex justify-center">
                {accept === "video" ? (
                  <Film className="h-10 w-10 opacity-40" />
                ) : accept === "image" ? (
                  <Image className="h-10 w-10 opacity-40" />
                ) : (
                  <FileText className="h-10 w-10 opacity-40" />
                )}
              </div>
              <p>No files in the library yet. Drag & drop above or upload from your device.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

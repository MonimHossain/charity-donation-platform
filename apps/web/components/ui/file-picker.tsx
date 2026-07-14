"use client";

import { useRef, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./button";
import { MediaPickerDialog } from "./media-picker-dialog";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { matchesMediaAccept, uploadMediaFile } from "@/lib/media-upload";
import { cn, imageAltFromSrc } from "@/lib/utils";

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

export function FilePicker({ value, onChange, accept = "all", label, className }: FilePickerProps) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragDepth = useRef(0);

  async function handleDroppedFiles(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;

    if (!matchesMediaAccept(file, accept)) {
      toast.error(
        accept === "image"
          ? "Please drop an image file"
          : accept === "video"
          ? "Please drop a video file"
          : "This file type is not supported here"
      );
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadMediaFile(file);
      onChange(uploaded.url, uploaded);
      toast.success("File uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
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
    void handleDroppedFiles(e.dataTransfer.files);
  }

  const dropZoneClass = cn(
    "transition-colors",
    dragOver && "border-primary bg-primary/5 ring-2 ring-primary/20",
    uploading && "pointer-events-none opacity-70"
  );

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}

      {value ? (
        <div
          className={cn("relative group rounded-lg border bg-muted/30 overflow-hidden", dropZoneClass)}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
            <img src={resolveMediaUrl(value) ?? value} alt={imageAltFromSrc(resolveMediaUrl(value) ?? value)} className="w-full h-32 object-cover" />
          ) : (
            <div className="h-32 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div
            className={cn(
              "absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-2",
              dragOver || uploading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : dragOver ? (
              <span className="text-xs font-medium text-white">Drop to replace</span>
            ) : (
              <>
                <Button size="sm" variant="secondary" type="button" onClick={() => setOpen(true)}>
                  Change
                </Button>
                <Button size="sm" variant="secondary" type="button" onClick={() => onChange("")}>
                  <X className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground p-1 truncate">{value.split("/").pop()}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => !uploading && setOpen(true)}
          className={cn(
            "w-full h-28 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 flex flex-col items-center justify-center gap-1",
            dropZoneClass
          )}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {dragOver ? "Drop file here" : uploading ? "Uploading..." : "Drag & drop or choose file"}
          </span>
        </button>
      )}

      <MediaPickerDialog
        open={open}
        onOpenChange={setOpen}
        accept={accept}
        selectedUrl={value}
        onSelect={(url, file) => onChange(url, file)}
      />
    </div>
  );
}

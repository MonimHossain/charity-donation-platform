"use client";

import { useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "./button";
import { MediaPickerDialog } from "./media-picker-dialog";
import { resolveMediaUrl } from "@/lib/campaign-media";

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

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1.5">{label}</label>}

      {value ? (
        <div className="relative group rounded-lg border bg-muted/30 overflow-hidden">
          {value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
            <img src={resolveMediaUrl(value) ?? value} alt="" className="w-full h-32 object-cover" />
          ) : (
            <div className="h-32 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
              Change
            </Button>
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

"use client";

import { useEffect, useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HtmlSnippetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (payload: { html: string; label: string }) => void;
  initialHtml?: string;
  initialLabel?: string;
}

export function HtmlSnippetDialog({
  open,
  onOpenChange,
  onConfirm,
  initialHtml = "",
  initialLabel = "HTML snippet",
}: HtmlSnippetDialogProps) {
  const [label, setLabel] = useState(initialLabel);
  const [html, setHtml] = useState(initialHtml);

  useEffect(() => {
    if (!open) return;
    setLabel(initialLabel || "HTML snippet");
    setHtml(initialHtml || "");
  }, [open, initialHtml, initialLabel]);

  function handleInsert() {
    const trimmed = html.trim();
    if (!trimmed) return;
    onConfirm({
      html: trimmed,
      label: label.trim() || "HTML snippet",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Braces className="h-5 w-5" />
            Insert HTML / code snippet
          </DialogTitle>
          <DialogDescription>
            Paste HTML (and optional &lt;script&gt;). It renders as an interactive widget on the public
            page — e.g. a Zakat calculator embed. Only paste code you trust.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="space-y-2 shrink-0">
            <Label htmlFor="html-snippet-label">Label (admin only)</Label>
            <Input
              id="html-snippet-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Zakat Calculator"
            />
          </div>
          <div className="space-y-2 flex-1 min-h-0 flex flex-col">
            <Label htmlFor="html-snippet-code">HTML code</Label>
            <textarea
              id="html-snippet-code"
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              placeholder={'<div class="my-widget">...</div>\n<script>...</script>'}
              className="min-h-[280px] flex-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              spellCheck={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleInsert} disabled={!html.trim()}>
            Insert snippet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

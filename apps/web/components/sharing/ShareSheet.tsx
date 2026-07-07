"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Copy,
  Check,
  Mail,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  shareText: string;
  shareUrl: string;
};

const POPUP = "width=600,height=520,scrollbars=yes,resizable=yes";

function openSharePopup(url: string) {
  const popup = window.open(url, "share-popup", POPUP);
  if (!popup) {
    toast.error("Popup blocked — use “Share with apps” or copy the link instead");
    return;
  }
  popup.focus();
}

export default function ShareSheet({
  open,
  onOpenChange,
  title = "Share your impact",
  description = "Inspire friends and family to join you — it only takes a moment.",
  shareText,
  shareUrl,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  const fullMessage = `${shareText}\n\n${shareUrl}`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Could not copy link");
    }
  }, [shareUrl]);

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullMessage);
      toast.success("Message copied — paste it anywhere you like");
    } catch {
      toast.error("Could not copy message");
    }
  }, [fullMessage]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({
        title,
        text: shareText,
        url: shareUrl,
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast.error("Sharing is not available on this device");
    }
  }, [title, shareText, shareUrl, onOpenChange]);

  const shareOptions = [
    {
      id: "facebook",
      label: "Facebook",
      icon: Facebook,
      className: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
      onClick: () =>
        openSharePopup(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`
        ),
    },
    {
      id: "twitter",
      label: "X",
      icon: Twitter,
      className: "bg-foreground/10 text-foreground hover:bg-foreground/15",
      onClick: () =>
        openSharePopup(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
        ),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: MessageCircle,
      className: "bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20",
      onClick: () =>
        openSharePopup(
          `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
        ),
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      className: "bg-primary/10 text-primary hover:bg-primary/15",
      onClick: () => {
        window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(fullMessage)}`;
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-md rounded-3xl gap-0 p-0 max-h-[90dvh] overflow-y-auto overflow-x-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 text-center sm:text-center min-w-0">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
            <Share2 className="h-6 w-6 text-accent-deep" />
          </div>
          <DialogTitle className="font-serif text-xl text-primary text-balance">{title}</DialogTitle>
          <DialogDescription className="text-sm text-balance leading-relaxed px-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-2 min-w-0">
          <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-left space-y-2 min-w-0 overflow-hidden">
            <p className="text-sm text-foreground leading-relaxed break-words">{shareText}</p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground min-w-0">
              <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="break-all leading-relaxed">{shareUrl}</span>
            </p>
          </div>
        </div>

        {canNativeShare && (
          <div className="px-5 pt-3 min-w-0">
            <Button
              type="button"
              className="w-full rounded-full h-11 gap-2 font-semibold"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 shrink-0" />
              Share with apps
            </Button>
            <p className="text-[11px] text-center text-muted-foreground mt-2 leading-relaxed text-balance">
              Opens your phone&apos;s share menu — Messages, Instagram, and more
            </p>
          </div>
        )}

        <div className="px-5 py-4 min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 text-center">
            Or share via
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {shareOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={opt.onClick}
                className="flex min-w-0 flex-col items-center gap-2 group"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl transition-colors",
                    opt.className
                  )}
                >
                  <opt.icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground text-center">
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border px-5 py-4 grid grid-cols-1 gap-2 min-w-0">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full gap-2 h-11"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="h-4 w-4 text-green-600 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />}
            {copied ? "Copied!" : "Copy link"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full rounded-full gap-2 h-11"
            onClick={handleCopyMessage}
          >
            <Copy className="h-4 w-4 shrink-0" />
            Copy message
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

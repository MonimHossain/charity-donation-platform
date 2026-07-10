"use client";

import RichContentRenderer from "@/components/blog/RichContentRenderer";

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

/** @deprecated Prefer RichContentRenderer — kept for existing imports. */
export default function BlogContentRenderer({ content, className }: BlogContentRendererProps) {
  return (
    <RichContentRenderer content={content} className={className} enableCampaignEmbeds sliderAutoplay />
  );
}

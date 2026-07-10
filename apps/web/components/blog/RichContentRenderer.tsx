"use client";

import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import { CampaignDonationEmbedWidget } from "@/components/blog/CampaignDonationEmbedWidget";
import { ImageSliderWidget } from "@/components/blog/ImageSliderWidget";
import {
  hasRichTextVisualContent,
  parseRichContentParts,
  richContentHasSpecialBlocks,
} from "@/lib/rich-content";

interface RichContentRendererProps {
  content: string;
  className?: string;
  /** Render campaign donation embed blocks (blog). */
  enableCampaignEmbeds?: boolean;
  /** Autoplay image sliders on public pages; off in editor preview. */
  sliderAutoplay?: boolean;
}

function htmlChunkHasContent(html: string): boolean {
  return hasRichTextVisualContent(html);
}

export default function RichContentRenderer({
  content,
  className,
  enableCampaignEmbeds = false,
  sliderAutoplay = true,
}: RichContentRendererProps) {
  if (!hasRichTextVisualContent(content)) {
    return null;
  }

  if (!richContentHasSpecialBlocks(content)) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  const parts = parseRichContentParts(content);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === "embed") {
          if (!enableCampaignEmbeds) {
            return null;
          }
          return (
            <CampaignDonationEmbedWidget
              key={`embed-${part.slug}-${index}`}
              slug={part.slug}
              title={part.title}
            />
          );
        }

        if (part.type === "imageSlider") {
          return (
            <ImageSliderWidget
              key={`slider-${index}`}
              images={part.images}
              autoplay={sliderAutoplay}
            />
          );
        }

        if (!htmlChunkHasContent(part.content)) return null;

        return <MarkdownRenderer key={`html-${index}`} content={part.content} />;
      })}
    </div>
  );
}

export { hasRichTextVisualContent };

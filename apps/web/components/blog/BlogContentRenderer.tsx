"use client";

import MarkdownRenderer from "@/components/blog/MarkdownRenderer";
import { CampaignDonationEmbedWidget } from "@/components/blog/CampaignDonationEmbedWidget";
import { blogContentHasEmbeds, parseBlogContentParts } from "@/lib/campaign-donation-embed";

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

export default function BlogContentRenderer({ content, className }: BlogContentRendererProps) {
  if (!blogContentHasEmbeds(content)) {
    return <MarkdownRenderer content={content} className={className} />;
  }

  const parts = parseBlogContentParts(content);

  return (
    <div className={className}>
      {parts.map((part, index) => {
        if (part.type === "embed") {
          return (
            <CampaignDonationEmbedWidget
              key={`embed-${part.slug}-${index}`}
              slug={part.slug}
              title={part.title}
            />
          );
        }

        const html = part.content.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, "").trim();
        if (!html) return null;

        return <MarkdownRenderer key={`html-${index}`} content={part.content} />;
      })}
    </div>
  );
}

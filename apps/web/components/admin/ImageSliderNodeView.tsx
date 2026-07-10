"use client";

import { NodeViewWrapper } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { ImageSliderCarousel } from "@/components/blog/ImageSliderCarousel";

export default function ImageSliderNodeView({ node, selected }: NodeViewProps) {
  const images = (node.attrs.images as string[]) || [];

  return (
    <NodeViewWrapper className="my-4" contentEditable={false}>
      <div
        className={`rounded-xl border-2 bg-card p-3 transition-colors ${
          selected ? "border-purple-500" : "border-border"
        }`}
        contentEditable={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Image slider ({images.length} images)
        </p>
        {images.length >= 2 ? (
          <ImageSliderCarousel images={images} autoplay={false} />
        ) : (
          <p className="text-sm text-destructive">Add at least 2 images to this slider.</p>
        )}
      </div>
    </NodeViewWrapper>
  );
}

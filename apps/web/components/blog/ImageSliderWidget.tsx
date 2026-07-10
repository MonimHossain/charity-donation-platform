"use client";

import { ImageSliderCarousel } from "@/components/blog/ImageSliderCarousel";

interface ImageSliderWidgetProps {
  images: string[];
  autoplay?: boolean;
  className?: string;
}

export function ImageSliderWidget({ images, autoplay = true, className }: ImageSliderWidgetProps) {
  return (
    <div className={className ?? "my-8"}>
      <ImageSliderCarousel images={images} autoplay={autoplay} />
    </div>
  );
}

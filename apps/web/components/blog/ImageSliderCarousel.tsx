"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { resolveMediaUrl } from "@/lib/campaign-media";
import { cn, imageAltFromSrc } from "@/lib/utils";

export interface ImageSliderCarouselProps {
  images: string[];
  autoplay?: boolean;
  autoplayMs?: number;
  className?: string;
}

export function ImageSliderCarousel({
  images,
  autoplay = true,
  autoplayMs = 5000,
  className,
}: ImageSliderCarouselProps) {
  const urls = images.map((u) => resolveMediaUrl(u) ?? u).filter(Boolean);
  const [index, setIndex] = useState(0);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const count = urls.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  useEffect(() => {
    if (!autoplay || count <= 1) return;
    const id = window.setInterval(() => go(index + 1), autoplayMs);
    return () => window.clearInterval(id);
  }, [autoplay, autoplayMs, count, go, index]);

  useEffect(() => {
    const strip = thumbStripRef.current;
    if (!strip) return;
    const active = strip.querySelector<HTMLElement>(`[data-thumb-index="${index}"]`);
    active?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [index]);

  if (count === 0) return null;

  const stopPm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className={cn("image-slider-widget w-full select-none", className)}
      contentEditable={false}
      onMouseDown={stopPm}
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
        <img
          src={urls[index]}
          alt={imageAltFromSrc(urls[index])}
          className="h-full w-full object-cover"
          draggable={false}
        />
        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous slide"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
              onMouseDown={stopPm}
              onClick={() => go(index - 1)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/60"
              onMouseDown={stopPm}
              onClick={() => go(index + 1)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-0.5 text-xs font-medium text-white tabular-nums">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div
          ref={thumbStripRef}
          className="mt-3 flex justify-center gap-2 overflow-x-auto px-1 py-1 scrollbar-thin"
        >
          {urls.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              data-thumb-index={i}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                i === index ? "border-accent ring-2 ring-accent/30" : "border-transparent opacity-70 hover:opacity-100"
              )}
              onMouseDown={stopPm}
              onClick={() => setIndex(i)}
            >
              <img src={url} alt={imageAltFromSrc(url)} className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

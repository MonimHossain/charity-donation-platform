"use client";

import { resolveMediaUrl } from "@/lib/campaign-media";
import { cn } from "@/lib/utils";

type HtmlVideoProps = {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function HtmlVideo({ src, poster, className, style }: HtmlVideoProps) {
  const resolved = resolveMediaUrl(src) ?? src;
  const resolvedPoster = poster ? resolveMediaUrl(poster) ?? poster : undefined;

  return (
    <video
      className={cn(
        "my-8 max-w-full w-full rounded-xl border border-gray-200 bg-black/5",
        className
      )}
      style={style}
      src={resolved}
      poster={resolvedPoster}
      controls
      playsInline
      preload="metadata"
    />
  );
}

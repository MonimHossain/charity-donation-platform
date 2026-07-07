"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BlogPostSidebarProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Right column on blog posts. Parent grid row must stretch (do not use items-start on the grid).
 * The aside grows to the article height; the inner panel sticks while you scroll the article.
 */
export function BlogPostSidebar({ children, className }: BlogPostSidebarProps) {
  return (
    <aside className={cn("w-full lg:min-h-0 lg:relative", className)}>
      <div
        className={cn(
          "space-y-6",
          "lg:sticky lg:top-[4.75rem] lg:z-30",
          "lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:overscroll-contain"
        )}
      >
        {children}
      </div>
    </aside>
  );
}

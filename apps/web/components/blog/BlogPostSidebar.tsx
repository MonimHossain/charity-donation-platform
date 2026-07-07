"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BlogPostSidebarProps = {
  children: ReactNode;
  className?: string;
};

/** Share / newsletter column — sticks under the site header on large screens while reading. */
export function BlogPostSidebar({ children, className }: BlogPostSidebarProps) {
  return (
    <aside className={cn("w-full lg:self-start", className)}>
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

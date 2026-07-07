"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const LG_BREAKPOINT = 1024;
/** Below sticky site nav (h-12/h-14) + small gap */
const PIN_TOP_PX = 76;

type BlogPostSidebarProps = {
  children: ReactNode;
  className?: string;
};

type PinState = "flow" | "fixed" | "dock-bottom";

/**
 * Desktop: Share / newsletter stay on screen while the left article column scrolls.
 * Uses fixed positioning tied to the sidebar grid column (works when CSS sticky is blocked).
 */
export function BlogPostSidebar({ children, className }: BlogPostSidebarProps) {
  const railRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState<PinState>("flow");
  const [fixedStyle, setFixedStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const rail = railRef.current;
      const panel = panelRef.current;
      if (!rail || !panel) return;

      if (window.innerWidth < LG_BREAKPOINT) {
        setPin("flow");
        setFixedStyle(null);
        return;
      }

      const railRect = rail.getBoundingClientRect();
      const panelHeight = panel.offsetHeight;
      const pinBottom = PIN_TOP_PX + panelHeight;

      if (railRect.top > PIN_TOP_PX) {
        setPin("flow");
        setFixedStyle(null);
        return;
      }

      if (railRect.bottom <= pinBottom + 12) {
        setPin("dock-bottom");
        setFixedStyle(null);
        return;
      }

      setPin("fixed");
      setFixedStyle({
        position: "fixed",
        top: PIN_TOP_PX,
        left: railRect.left,
        width: railRect.width,
        zIndex: 30,
      });
    };

    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return (
    <aside
      ref={railRef}
      className={cn("w-full lg:self-stretch lg:relative", className)}
    >
      <div
        ref={panelRef}
        className={cn(
          "space-y-6 w-full",
          pin === "dock-bottom" && "lg:absolute lg:bottom-0 lg:left-0 lg:right-0",
          pin === "flow" &&
            "lg:sticky lg:top-[4.75rem] lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:overscroll-contain"
        )}
        style={pin === "fixed" ? fixedStyle ?? undefined : undefined}
      >
        {children}
      </div>
    </aside>
  );
}

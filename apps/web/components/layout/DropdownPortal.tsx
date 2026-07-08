"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

interface DropdownPortalProps {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function DropdownPortal({
  open,
  triggerRef,
  children,
  align = "left",
  className = "",
}: DropdownPortalProps) {
  const [position, setPosition] = useState({ top: 0, left: 0, right: 0 });

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
        right: window.innerWidth - rect.right,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, triggerRef]);

  if (!open || typeof document === "undefined") return null;

  const style: React.CSSProperties = {
    position: "fixed",
    top: position.top,
    ...(align === "right" ? { right: position.right } : { left: position.left }),
    zIndex: 300,
  };

  return createPortal(
    <div className={className} style={style} data-dropdown-portal="true">
      {children}
    </div>,
    document.body
  );
}

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
};

/** MATW-style shimmer sweep for primary donate CTAs */
export function DonateButtonEffect({ children, className, as: Tag = "span" }: Props) {
  return (
    <Tag className={cn("donate-button-effect relative inline-flex overflow-hidden", className)}>
      {children}
    </Tag>
  );
}

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface CampaignFeaturedBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function CampaignFeaturedBadge({ className, size = "sm" }: CampaignFeaturedBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-400/95 font-bold uppercase tracking-wider text-amber-950 shadow-md backdrop-blur",
        size === "sm" ? "px-2.5 py-1 text-[10px] sm:text-xs" : "px-3 py-1 text-xs",
        className
      )}
    >
      <Star className={cn("fill-amber-950", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      Featured
    </span>
  );
}

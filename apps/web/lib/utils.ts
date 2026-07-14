import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Alt text from the image filename (last path segment). */
export function imageAltFromSrc(src?: string | null, fallback = "image"): string {
  if (!src?.trim()) return fallback;
  try {
    const cleaned = src.trim().split("?")[0].split("#")[0];
    const path = cleaned.includes("://") ? new URL(cleaned).pathname : cleaned;
    const name = path.split("/").filter(Boolean).pop();
    if (!name) return fallback;
    return decodeURIComponent(name);
  } catch {
    const name = src.trim().split("?")[0].split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : fallback;
  }
}

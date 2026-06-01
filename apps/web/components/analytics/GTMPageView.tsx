"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/components/analytics/GTMScript";

/** Fires a virtual page_view on client navigations. */
export default function GTMPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackEvent("page_view", {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}

"use client";

import { MockAuthProvider } from "@/lib/mock-auth";
import { USE_MOCK_DATA } from "@/lib/config";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { purgeStaleAdminTokens } from "@/lib/admin-auth";
import { useEffect, type ReactNode } from "react";

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    purgeStaleAdminTokens();
  }, []);

  return (
    <QueryProvider>
      {USE_MOCK_DATA ? <MockAuthProvider>{children}</MockAuthProvider> : children}
    </QueryProvider>
  );
}

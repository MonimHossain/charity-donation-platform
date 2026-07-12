"use client";

import { resolveAdminPagePermission } from "@repo/shared-types";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { hasAdminPermission, isSuperAdminSession, readAdminSessionFromStorage, useAdminSession } from "./AdminSessionProvider";

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/reset-password",
]);

export function AdminPageGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const session = useAdminSession();
  const effectiveSession = session ?? readAdminSessionFromStorage();

  if (PUBLIC_ADMIN_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  const required = resolveAdminPagePermission(pathname);

  if (!required) {
    return <>{children}</>;
  }

  if (!effectiveSession) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading your session…</p>
      </div>
    );
  }

  if (!hasAdminPermission(effectiveSession, required)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
        <h2 className="text-lg font-semibold text-foreground">Access denied</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          You do not have permission to view this page. Contact a super admin if you need access.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function canAccessAdminNav(
  session: ReturnType<typeof useAdminSession>,
  permission: string,
  superAdminOnly?: boolean
): boolean {
  if (!session) return false;
  if (superAdminOnly) return isSuperAdminSession(session);
  return hasAdminPermission(session, permission);
}

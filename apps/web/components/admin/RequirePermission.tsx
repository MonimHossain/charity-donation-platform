"use client";

import { hasAdminPermission, useAdminSession } from "./AdminSessionProvider";
import type { ReactNode } from "react";

interface Props {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RequirePermission({ permission, children, fallback }: Props) {
  const session = useAdminSession();

  if (!session) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasAdminPermission(session, permission)) {
    return (
      fallback ?? (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

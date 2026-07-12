"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { permissionsForSuperAdmin } from "@repo/shared-types";
import { fetchAdminProfile } from "@/lib/api";
import { isMockAdminSession, DEFAULT_DEMO_ADMIN_PROFILE, isValidAdminToken } from "@/lib/admin-auth";

export const ADMIN_SESSION_SYNC_EVENT = "admin-session-sync";

export function notifyAdminSessionSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_SESSION_SYNC_EVENT));
  }
}

export interface AdminSession {
  id: string | number;
  email: string;
  fullName: string;
  permissions: string[];
  roles: { id: number; name: string; code: string }[];
  role?: string;
}

function buildSession(profile: Record<string, unknown>): AdminSession {
  const roles = (profile.roles as AdminSession["roles"]) ?? [];
  const isSuper = profile.role === "super_admin" || roles.some((r) => r.code === "SUPER_ADMIN");
  const permissions = isSuper
    ? permissionsForSuperAdmin()
    : ((profile.permissions as string[]) ?? []);

  return {
    id: (profile.id as string | number) ?? "unknown",
    email: String(profile.email ?? ""),
    fullName: String(profile.fullName || profile.name || "Admin"),
    permissions,
    roles,
    role: profile.role as string | undefined,
  };
}

export function readAdminSessionFromStorage(): AdminSession | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("admin_token");
  if (!isValidAdminToken(token)) return null;

  if (isMockAdminSession(token)) {
    try {
      const cached = localStorage.getItem("admin_profile");
      const profile = cached ? JSON.parse(cached) : DEFAULT_DEMO_ADMIN_PROFILE;
      return buildSession(profile);
    } catch {
      return buildSession(DEFAULT_DEMO_ADMIN_PROFILE);
    }
  }

  const cached = localStorage.getItem("admin_profile");
  if (!cached) return null;
  try {
    return buildSession(JSON.parse(cached));
  } catch {
    return null;
  }
}

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession(): AdminSession | null {
  return useContext(AdminSessionContext);
}

export function isSuperAdminSession(session: AdminSession | null): boolean {
  if (!session) return false;
  return (
    session.role === "super_admin" ||
    session.roles?.some((r) => r.code === "SUPER_ADMIN") === true
  );
}

export function hasAdminPermission(session: AdminSession | null, permission: string): boolean {
  if (!session) return false;
  if (isSuperAdminSession(session)) return true;
  return session.permissions?.includes(permission) ?? false;
}

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(() => readAdminSessionFromStorage());

  const syncFromStorage = useCallback(() => {
    setSession(readAdminSessionFromStorage());
  }, []);

  useEffect(() => {
    syncFromStorage();
  }, [pathname, syncFromStorage]);

  useEffect(() => {
    window.addEventListener(ADMIN_SESSION_SYNC_EVENT, syncFromStorage);
    return () => window.removeEventListener(ADMIN_SESSION_SYNC_EVENT, syncFromStorage);
  }, [syncFromStorage]);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setSession(null);
      return;
    }

    if (isMockAdminSession(token)) {
      syncFromStorage();
      return;
    }

    syncFromStorage();

    fetchAdminProfile()
      .then((profile: Record<string, unknown>) => {
        localStorage.setItem("admin_profile", JSON.stringify(profile));
        setSession(buildSession(profile));
      })
      .catch(() => {});
  }, [syncFromStorage]);

  return (
    <AdminSessionContext.Provider value={session}>
      {children}
    </AdminSessionContext.Provider>
  );
}

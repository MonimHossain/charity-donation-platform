"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchAdminProfile } from "@/lib/api";
import { isMockAdminSession, DEFAULT_DEMO_ADMIN_PROFILE } from "@/lib/admin-auth";
import { permissionsForSuperAdmin } from "@repo/shared-types";

export interface AdminSession {
  id: string | number;
  email: string;
  fullName: string;
  permissions: string[];
  roles: { id: number; name: string; code: string }[];
  role?: string;
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

export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    if (isMockAdminSession(token)) {
      const cached = localStorage.getItem("admin_profile");
      try {
        const profile = cached ? JSON.parse(cached) : DEFAULT_DEMO_ADMIN_PROFILE;
        setSession(buildSession(profile));
      } catch {
        setSession(buildSession(DEFAULT_DEMO_ADMIN_PROFILE));
      }
      return;
    }

    const cached = localStorage.getItem("admin_profile");
    if (cached) {
      try {
        setSession(buildSession(JSON.parse(cached)));
      } catch {
        // ignore
      }
    }

    fetchAdminProfile()
      .then((profile: Record<string, unknown>) => {
        localStorage.setItem("admin_profile", JSON.stringify(profile));
        setSession(buildSession(profile));
      })
      .catch(() => {});
  }, []);

  return (
    <AdminSessionContext.Provider value={session}>
      {children}
    </AdminSessionContext.Provider>
  );
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchAdminProfile } from "@/lib/api";
import { isMockAdminSession, DEFAULT_DEMO_ADMIN_PROFILE } from "@/lib/admin-auth";

export interface AdminSession {
  id: string | number;
  email: string;
  fullName: string;
  permissions: string[];
  roles: { id: number; name: string; code: string }[];
}

const AdminSessionContext = createContext<AdminSession | null>(null);

export function useAdminSession(): AdminSession | null {
  return useContext(AdminSessionContext);
}

export function hasAdminPermission(session: AdminSession | null, permission: string): boolean {
  if (!session) return false;
  if (session.roles?.some((r) => r.code === "SUPER_ADMIN")) return true;
  return session.permissions?.includes(permission) ?? false;
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
        setSession({
          id: profile.id ?? "demo",
          email: profile.email,
          fullName: profile.fullName || profile.name || "Admin Demo",
          permissions: profile.permissions ?? [],
          roles: profile.roles ?? DEFAULT_DEMO_ADMIN_PROFILE.roles,
        });
      } catch {
        setSession({
          id: "demo",
          email: DEFAULT_DEMO_ADMIN_PROFILE.email,
          fullName: DEFAULT_DEMO_ADMIN_PROFILE.fullName,
          permissions: [],
          roles: DEFAULT_DEMO_ADMIN_PROFILE.roles,
        });
      }
      return;
    }

    fetchAdminProfile()
      .then((profile: any) => {
        setSession({
          id: profile.id,
          email: profile.email,
          fullName: profile.fullName || profile.name || "Admin",
          permissions: profile.permissions ?? [],
          roles: profile.roles ?? [],
        });
      })
      .catch(() => {});
  }, []);

  return (
    <AdminSessionContext.Provider value={session}>
      {children}
    </AdminSessionContext.Provider>
  );
}

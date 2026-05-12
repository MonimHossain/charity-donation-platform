"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchAdminProfile } from "@/lib/api";

export interface AdminSession {
  id: number;
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

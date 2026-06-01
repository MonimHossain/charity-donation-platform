"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AppRole = "admin" | "editor" | "donor";

export interface DemoSessionUser {
  id: string;
  email: string;
  name: string;
}

interface AuthCtx {
  session: { user: DemoSessionUser } | null;
  user: DemoSessionUser | null;
  roles: AppRole[];
  loading: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const STORAGE_KEY = "demo-session";

const readSession = (): { user: DemoSessionUser; roles: AppRole[] } | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setDemoSession = (user: DemoSessionUser, roles: AppRole[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, roles }));
  window.dispatchEvent(new Event("demo-session-change"));
};

const clearDemoSession = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("demo-session-change"));
};

const Ctx = createContext<AuthCtx | null>(null);

export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: DemoSessionUser; roles: AppRole[] } | null>(
    () => readSession()
  );

  useEffect(() => {
    const sync = () => setState(readSession());
    window.addEventListener("storage", sync);
    window.addEventListener("demo-session-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("demo-session-change", sync);
    };
  }, []);

  const value: AuthCtx = {
    session: state ? { user: state.user } : null,
    user: state?.user ?? null,
    roles: state?.roles ?? [],
    loading: false,
    isStaff: !!state?.roles.some((r) => r === "admin" || r === "editor"),
    isAdmin: !!state?.roles.includes("admin"),
    signOut: async () => {
      clearDemoSession();
      setState(null);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMockAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMockAuth must be used inside MockAuthProvider");
  return c;
}

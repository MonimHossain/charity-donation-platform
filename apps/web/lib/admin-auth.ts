import { USE_MOCK_DATA } from "@/lib/config";

/** Token used for frontend-only admin demo (no API). */
export const DEMO_ADMIN_TOKEN = "demo-admin-token";

export function isDemoAdminToken(token: string | null): boolean {
  return Boolean(token && token === DEMO_ADMIN_TOKEN);
}

export function isJwtAdminToken(token: string | null): boolean {
  if (!token || token === "undefined") return false;
  return token.split(".").length === 3;
}

/** Real API Bearer token only — never send demo token to the backend. */
export function canSendAdminTokenToApi(token: string | null): boolean {
  if (!isJwtAdminToken(token)) return false;
  if (isDemoAdminToken(token)) return false;
  return true;
}

/** Whether the stored admin token is allowed to access /admin UI. */
export function isValidAdminToken(token: string | null): boolean {
  if (!token || token === "undefined") return false;
  if (USE_MOCK_DATA && isDemoAdminToken(token)) return true;
  return isJwtAdminToken(token);
}

/** Demo session: trust local profile only; do not call /admin/profile. */
export function isMockAdminSession(token: string | null): boolean {
  return USE_MOCK_DATA && isDemoAdminToken(token);
}

/** Remove tokens that would cause /admin/profile 401 when using the real API. */
export function purgeStaleAdminTokens(): void {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  if (isDemoAdminToken(token) && !USE_MOCK_DATA) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
    return;
  }

  if (!isValidAdminToken(token)) {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_profile");
  }
}

export const DEFAULT_DEMO_ADMIN_PROFILE = {
  id: "demo",
  email: "admin@example.com",
  fullName: "Admin Demo",
  name: "Admin Demo",
  role: "super_admin",
  permissions: [] as string[],
  roles: [{ id: 1, name: "Super Admin", code: "SUPER_ADMIN" }],
};

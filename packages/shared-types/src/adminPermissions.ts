export type AdminPermissionType = "view" | "action";

export interface AdminPermissionDef {
  code: string;
  label: string;
  type: AdminPermissionType;
}

export interface AdminPermissionModule {
  module: string;
  label: string;
  navHref?: string;
  superAdminOnly?: boolean;
  permissions: AdminPermissionDef[];
}

function mod(
  module: string,
  label: string,
  opts: {
    navHref?: string;
    superAdminOnly?: boolean;
    actions?: string[];
    extra?: AdminPermissionDef[];
  } = {}
): AdminPermissionModule {
  const perms: AdminPermissionDef[] = [
    { code: `${module}.view`, label: "View", type: "view" },
    ...(opts.actions ?? ["create", "update", "delete"]).map((action) => ({
      code: `${module}.${action}`,
      label: action.charAt(0).toUpperCase() + action.slice(1),
      type: "action" as const,
    })),
    ...(opts.extra ?? []),
  ];
  return {
    module,
    label,
    navHref: opts.navHref,
    superAdminOnly: opts.superAdminOnly,
    permissions: perms,
  };
}

export const ADMIN_PERMISSION_MODULES: AdminPermissionModule[] = [
  mod("dashboard", "Dashboard", { navHref: "/admin", actions: [] }),
  mod("analytics", "Analytics", { navHref: "/admin/analytics", actions: [] }),
  mod("campaigns", "Campaigns", { navHref: "/admin/campaigns" }),
  mod("upsells", "Upsells", { navHref: "/admin/upsells" }),
  mod("quick_donate", "Quick Donate Form", { navHref: "/admin/quick-donate" }),
  mod("donations", "Donations", {
    navHref: "/admin/donations",
    actions: ["update"],
    extra: [{ code: "donations.refund", label: "Refund", type: "action" }],
  }),
  mod("payments", "Payments", { navHref: "/admin/payments", actions: [] }),
  mod("recurring", "Recurring", { navHref: "/admin/recurring", actions: [] }),
  mod("automated", "Automated", { navHref: "/admin/automated", actions: [] }),
  mod("donor_users", "Users (Donors)", {
    navHref: "/admin/users",
    actions: ["update"],
  }),
  mod("blog", "Blog", { navHref: "/admin/blog" }),
  mod("reviews", "Reviews", { navHref: "/admin/reviews" }),
  mod("cms", "CMS", { navHref: "/admin/settings" }),
  mod("email", "Email", {
    navHref: "/admin/email/templates",
    extra: [{ code: "email.send", label: "Send", type: "action" }],
  }),
  mod("activity", "Activity Log", { navHref: "/admin/activity", actions: [] }),
  mod("settings", "Settings", {
    navHref: "/admin/settings",
    actions: ["update"],
  }),
  mod("donation_pages", "Donation Pages", { navHref: "/admin/donation-pages" }),
  mod("experts", "Experts", { navHref: "/admin/experts" }),
  mod("applications", "Applications", {
    navHref: "/admin/applications",
    actions: ["delete"],
    extra: [{ code: "applications.review", label: "Review", type: "action" }],
  }),
  mod("contact_messages", "Contact Messages", {
    navHref: "/admin/contact-messages",
    actions: ["delete"],
    extra: [{ code: "contact_messages.review", label: "Review", type: "action" }],
  }),
  mod("concerns", "Concerns", {
    navHref: "/admin/concerns",
    actions: ["delete"],
    extra: [{ code: "concerns.review", label: "Review", type: "action" }],
  }),
  mod("history", "History", { navHref: "/admin/history", actions: [] }),
  mod("admins", "User Management", {
    navHref: "/admin/admin-users",
    superAdminOnly: true,
  }),
];

export const ALL_ADMIN_PERMISSION_CODES = ADMIN_PERMISSION_MODULES.flatMap((m) =>
  m.permissions.map((p) => p.code)
);

export const SUPER_ADMIN_ROLE = "super_admin";

export function isSuperAdminRole(role: string | undefined | null): boolean {
  return role === SUPER_ADMIN_ROLE || role === "SUPER_ADMIN";
}

export function permissionsForSuperAdmin(): string[] {
  return [...ALL_ADMIN_PERMISSION_CODES];
}

export function getAdminPermissionModule(module: string): AdminPermissionModule | undefined {
  return ADMIN_PERMISSION_MODULES.find((m) => m.module === module);
}

export function getViewPermissionForModule(module: string): string | undefined {
  return getAdminPermissionModule(module)?.permissions.find((p) => p.type === "view")?.code;
}

const NAV_HREF_PERMISSIONS: { prefix: string; permission: string }[] = ADMIN_PERMISSION_MODULES.filter(
  (m) => m.navHref
)
  .map((m) => ({
    prefix: m.navHref!,
    permission: m.permissions.find((p) => p.type === "view")!.code,
  }))
  .sort((a, b) => b.prefix.length - a.prefix.length);

export function navPermissionForHref(href: string): string | undefined {
  const match = NAV_HREF_PERMISSIONS.find(
    (entry) => href === entry.prefix || href.startsWith(`${entry.prefix}/`)
  );
  return match?.permission;
}

export function resolveAdminPagePermission(pathname: string): string | undefined {
  if (pathname === "/admin" || pathname === "/admin/") {
    return "dashboard.view";
  }

  const override = ADMIN_PAGE_PERMISSION_OVERRIDES.find(
    (entry) => pathname === entry.prefix || pathname.startsWith(`${entry.prefix}/`)
  );
  if (override) return override.permission;

  return navPermissionForHref(pathname);
}

const ADMIN_PAGE_PERMISSION_OVERRIDES: { prefix: string; permission: string }[] = [
  { prefix: "/admin/notifications", permission: "dashboard.view" },
  { prefix: "/admin/logs", permission: "activity.view" },
  { prefix: "/admin/dashboard-overview", permission: "dashboard.view" },
  { prefix: "/admin/expenditures", permission: "analytics.view" },
  { prefix: "/admin/file-manager", permission: "cms.view" },
];

export function validatePermissionCodes(
  codes: string[],
  opts: { allowSuperAdminOnly?: boolean } = {}
): string[] {
  const allowed = new Set(ALL_ADMIN_PERMISSION_CODES);
  const superAdminOnly = new Set(
    ADMIN_PERMISSION_MODULES.filter((m) => m.superAdminOnly).flatMap((m) =>
      m.permissions.map((p) => p.code)
    )
  );

  return [...new Set(codes)].filter((code) => {
    if (!allowed.has(code)) return false;
    if (!opts.allowSuperAdminOnly && superAdminOnly.has(code)) return false;
    return true;
  });
}

export function adminRolesFromDbRole(role: string): { id: number; name: string; code: string }[] {
  if (isSuperAdminRole(role)) {
    return [{ id: 1, name: "Super Admin", code: "SUPER_ADMIN" }];
  }
  return [{ id: 2, name: "Admin", code: "ADMIN" }];
}

export function effectiveAdminPermissions(
  role: string,
  stored: string[] | null | undefined
): string[] {
  if (isSuperAdminRole(role)) {
    return permissionsForSuperAdmin();
  }
  return Array.isArray(stored) ? stored : [];
}

export function formatAdminPermissionsCatalog() {
  return ADMIN_PERMISSION_MODULES.map((m) => ({
    module: m.module,
    label: m.label,
    superAdminOnly: m.superAdminOnly ?? false,
    permissions: m.permissions.map((p) => ({
      id: p.code,
      code: p.code,
      label: p.label,
      type: p.type,
      module: m.label,
    })),
  }));
}

import { Request, Response, NextFunction } from "express";
import { adminHasPermission, loadAdminContext } from "./adminPermissionUtils.js";
import { isSuperAdminRole } from "../../constants/adminPermissions.js";

type RouteRule = {
  pattern: RegExp;
  view: string;
  create?: string;
  update?: string;
  delete?: string;
  superAdminOnly?: boolean;
};

const ROUTE_RULES: RouteRule[] = [
  { pattern: /^\/admin\/staff(?:\/|$)/, view: "__super_admin__", superAdminOnly: true },
  { pattern: /^\/admin\/permissions(?:\/|$)/, view: "__super_admin__", superAdminOnly: true },
  { pattern: /^\/admin\/roles(?:\/|$)/, view: "__super_admin__", superAdminOnly: true },
  { pattern: /^\/admin\/campaigns(?:\/|$)/, view: "campaigns.view", create: "campaigns.create", update: "campaigns.update", delete: "campaigns.delete" },
  { pattern: /^\/admin\/upsells(?:\/|$)/, view: "upsells.view", create: "upsells.create", update: "upsells.update", delete: "upsells.delete" },
  { pattern: /^\/admin\/quick-donate(?:\/|$)/, view: "quick_donate.view", create: "quick_donate.create", update: "quick_donate.update", delete: "quick_donate.delete" },
  { pattern: /^\/admin\/donations(?:\/|$)/, view: "donations.view", update: "donations.update" },
  { pattern: /^\/admin\/payment-logs(?:\/|$)/, view: "payments.view" },
  { pattern: /^\/admin\/payments(?:\/|$)/, view: "payments.view" },
  { pattern: /^\/admin\/recurring(?:\/|$)/, view: "recurring.view" },
  { pattern: /^\/admin\/automated-donations(?:\/|$)/, view: "automated.view" },
  { pattern: /^\/admin\/users(?:\/|$)/, view: "donor_users.view", update: "donor_users.update" },
  { pattern: /^\/admin\/blog(?:\/|$)/, view: "blog.view", create: "blog.create", update: "blog.update", delete: "blog.delete" },
  { pattern: /^\/admin\/cms(?:\/|$)/, view: "cms.view", create: "cms.create", update: "cms.update", delete: "cms.delete" },
  { pattern: /^\/admin\/email-management(?:\/|$)/, view: "email.view", create: "email.create", update: "email.update", delete: "email.delete" },
  { pattern: /^\/admin\/newsletter(?:\/|$)/, view: "email.view" },
  { pattern: /^\/admin\/analytics(?:\/|$)/, view: "analytics.view" },
  { pattern: /^\/admin\/activity-logs(?:\/|$)/, view: "activity.view" },
  { pattern: /^\/admin\/audit-logs(?:\/|$)/, view: "activity.view" },
  { pattern: /^\/admin\/charities(?:\/|$)/, view: "charities.view", create: "charities.create", update: "charities.update", delete: "charities.delete" },
  { pattern: /^\/admin\/certifications(?:\/|$)/, view: "certifications.view", create: "certifications.create", update: "certifications.update", delete: "certifications.delete" },
  { pattern: /^\/admin\/concerns(?:\/|$)/, view: "concerns.view", update: "concerns.review", delete: "concerns.delete" },
  { pattern: /^\/admin\/apply-review(?:\/|$)/, view: "applications.view", update: "applications.review", delete: "applications.delete" },
  { pattern: /^\/admin\/donation-pages(?:\/|$)/, view: "donation_pages.view", create: "donation_pages.create", update: "donation_pages.update", delete: "donation_pages.delete" },
  { pattern: /^\/admin\/notifications(?:\/|$)/, view: "dashboard.view" },
  { pattern: /^\/admin\/experts(?:\/|$)/, view: "experts.view", create: "experts.create", update: "experts.update", delete: "experts.delete" },
  { pattern: /^\/admin\/contact(?:\/|$)/, view: "contact_messages.view", update: "contact_messages.review", delete: "contact_messages.delete" },
];

const EXEMPT_PATHS = new Set([
  "/admin/login",
  "/admin/logout",
  "/admin/profile",
]);

function permissionForMethod(rule: RouteRule, method: string): string | null {
  const m = method.toUpperCase();
  if (m === "GET" || m === "HEAD") return rule.view;
  if (m === "POST") return rule.create ?? rule.update ?? rule.view;
  if (m === "PUT" || m === "PATCH") return rule.update ?? rule.view;
  if (m === "DELETE") return rule.delete ?? rule.view;
  return rule.view;
}

function findRouteRule(path: string): RouteRule | undefined {
  return ROUTE_RULES.find((rule) => rule.pattern.test(path));
}

export function adminRoutePermissionMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = req.path;
      if (EXEMPT_PATHS.has(path) || path.startsWith("/admin/profile/")) {
        return next();
      }
      if (!path.startsWith("/admin/")) {
        return next();
      }

      const rule = findRouteRule(path);
      if (!rule) {
        return next();
      }

      const ctx = await loadAdminContext(req);
      if (!ctx) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (rule.superAdminOnly || rule.view === "__super_admin__") {
        if (!isSuperAdminRole(ctx.role)) {
          return res.status(403).json({ message: "Super admin access required" });
        }
        return next();
      }

      const required = permissionForMethod(rule, req.method);
      if (required && !adminHasPermission(ctx, required)) {
        if (req.method.toUpperCase() === "PUT" && path.includes("/refund")) {
          if (adminHasPermission(ctx, "donations.refund")) return next();
        }
        if (req.method.toUpperCase() === "POST" && path.includes("/send")) {
          if (adminHasPermission(ctx, "email.send")) return next();
        }
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      (req as any).adminContext = ctx;
      return next();
    } catch (error) {
      console.error("adminRoutePermissionMiddleware error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

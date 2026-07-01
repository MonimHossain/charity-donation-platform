import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";
import {
  effectiveAdminPermissions,
  isSuperAdminRole,
} from "@repo/shared-types";

export interface AdminRequestContext {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export async function loadAdminContext(req: Request): Promise<AdminRequestContext | null> {
  const adminId = (req as any).admin?.id as string | undefined;
  if (!adminId) return null;

  if (!AppDataSource.isInitialized) return null;

  const admin = await AppDataSource.getRepository(Admin).findOne({ where: { id: adminId } });
  if (!admin || !admin.isActive) return null;

  return {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    permissions: effectiveAdminPermissions(admin.role, admin.permissions),
  };
}

export function adminHasPermission(ctx: AdminRequestContext | null, permission: string): boolean {
  if (!ctx) return false;
  if (isSuperAdminRole(ctx.role)) return true;
  return ctx.permissions.includes(permission);
}

export async function assertAdminPermission(
  req: Request,
  res: Response,
  permission: string
): Promise<AdminRequestContext | null> {
  const ctx = await loadAdminContext(req);
  if (!ctx) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }
  if (!adminHasPermission(ctx, permission)) {
    res.status(403).json({ message: "Insufficient permissions" });
    return null;
  }
  (req as any).adminContext = ctx;
  return ctx;
}

export async function assertSuperAdmin(req: Request, res: Response): Promise<AdminRequestContext | null> {
  const ctx = await loadAdminContext(req);
  if (!ctx) {
    res.status(401).json({ message: "Authentication required" });
    return null;
  }
  if (!isSuperAdminRole(ctx.role)) {
    res.status(403).json({ message: "Super admin access required" });
    return null;
  }
  (req as any).adminContext = ctx;
  return ctx;
}

export async function getTargetAdmin(id: string): Promise<Admin | null> {
  if (!AppDataSource.isInitialized) return null;
  return AppDataSource.getRepository(Admin).findOne({ where: { id } });
}

export function isProtectedSuperAdmin(admin: Admin): boolean {
  return isSuperAdminRole(admin.role);
}

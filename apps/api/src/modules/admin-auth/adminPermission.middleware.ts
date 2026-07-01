import { Request, Response, NextFunction } from "express";
import { assertAdminPermission, assertSuperAdmin } from "./adminPermissionUtils.js";

export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;
    next();
  };
}

export function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ctx = await assertAdminPermission(req, res, permission);
    if (!ctx) return;
    next();
  };
}

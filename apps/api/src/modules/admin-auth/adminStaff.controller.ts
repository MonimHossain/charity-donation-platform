import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";
import {
  adminRolesFromDbRole,
  effectiveAdminPermissions,
  formatAdminPermissionsCatalog,
  isSuperAdminRole,
  validatePermissionCodes,
} from "@repo/shared-types";
import { assertSuperAdmin, getTargetAdmin, isProtectedSuperAdmin } from "./adminPermissionUtils.js";

const repo = () => AppDataSource.getRepository(Admin);

function serializeAdmin(a: Admin) {
  const roles = adminRolesFromDbRole(a.role);
  const permissions = effectiveAdminPermissions(a.role, a.permissions);
  return {
    id: a.id,
    email: a.email,
    fullName: a.fullName,
    isActive: a.isActive,
    role: a.role,
    roles,
    permissions,
    permissionCount: permissions.length,
    createdAt: a.createdAt,
  };
}

export async function listAdminStaff(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const { search, isActive, page = "1", limit = "20" } = req.query;
    const qb = repo().createQueryBuilder("a").orderBy("a.createdAt", "DESC");

    if (search) {
      qb.andWhere("(a.email ILIKE :s OR a.fullName ILIKE :s)", { s: `%${search}%` });
    }
    if (isActive !== undefined) {
      const active = String(isActive) === "true" || String(isActive) === "1";
      qb.andWhere("a.isActive = :active", { active });
    }

    const total = await qb.getCount();
    const items = await qb
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit))
      .getMany();

    return res.json({
      data: items.map(serializeAdmin),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminStaff(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const { email, password, fullName, isActive = true, permissions } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "email, password, fullName required" });
    }
    const existing = await repo().findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const validatedPermissions = validatePermissionCodes(
      Array.isArray(permissions) ? permissions : []
    );

    const admin = repo().create({
      email,
      fullName,
      passwordHash: await bcrypt.hash(password, 12),
      isActive: Boolean(isActive),
      role: "admin",
      permissions: validatedPermissions,
    });
    await repo().save(admin);
    return res.status(201).json(serializeAdmin(admin));
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminStaff(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const admin = await repo().findOne({ where: { id: routeParam(req, "id") } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    if (isProtectedSuperAdmin(admin)) {
      return res.status(403).json({ message: "Super admin account cannot be modified" });
    }

    const { fullName, email, isActive, permissions, password } = req.body;
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (isActive !== undefined) admin.isActive = Boolean(isActive);
    if (permissions !== undefined) {
      admin.permissions = validatePermissionCodes(
        Array.isArray(permissions) ? permissions : []
      );
    }
    if (password) admin.passwordHash = await bcrypt.hash(password, 12);

    await repo().save(admin);
    return res.json(serializeAdmin(admin));
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminStaff(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const admin = await getTargetAdmin(routeParam(req, "id"));
    if (!admin) return res.status(404).json({ message: "Not found" });
    if (isProtectedSuperAdmin(admin)) {
      return res.status(403).json({ message: "Super admin account cannot be deleted" });
    }

    await repo().delete({ id: admin.id });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminStaffStatus(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const admin = await repo().findOne({ where: { id: routeParam(req, "id") } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    if (isProtectedSuperAdmin(admin)) {
      return res.status(403).json({ message: "Super admin account cannot be modified" });
    }

    admin.isActive = Boolean(req.body.isActive);
    await repo().save(admin);
    return res.json({ id: admin.id, isActive: admin.isActive });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetAdminStaffPassword(req: Request, res: Response) {
  try {
    const ctx = await assertSuperAdmin(req, res);
    if (!ctx) return;

    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "password required" });

    const admin = await repo().findOne({ where: { id: routeParam(req, "id") } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    if (isProtectedSuperAdmin(admin)) {
      return res.status(403).json({ message: "Super admin password must be changed via profile" });
    }

    admin.passwordHash = await bcrypt.hash(password, 12);
    await repo().save(admin);
    return res.json({ message: "Password updated" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminRoles(_req: Request, res: Response) {
  return res.json({ data: [] });
}

export async function listAdminPermissions(req: Request, res: Response) {
  const ctx = await assertSuperAdmin(req, res);
  if (!ctx) return;

  const catalog = formatAdminPermissionsCatalog().filter((m) => !m.superAdminOnly);
  return res.json({ data: catalog });
}

export function buildAdminAuthPayload(admin: Admin) {
  const roles = adminRolesFromDbRole(admin.role);
  const permissions = effectiveAdminPermissions(admin.role, admin.permissions);
  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
    roles,
    permissions,
    isSuperAdmin: isSuperAdminRole(admin.role),
  };
}

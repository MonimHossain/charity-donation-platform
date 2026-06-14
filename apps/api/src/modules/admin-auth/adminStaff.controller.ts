import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";

const repo = () => AppDataSource.getRepository(Admin);

const ROLES = [
  { id: 1, name: "Super Admin", code: "SUPER_ADMIN", label: "Super Admin" },
  { id: 2, name: "Admin", code: "ADMIN", label: "Admin" },
  { id: 3, name: "Editor", code: "EDITOR", label: "Editor" },
  { id: 4, name: "Viewer", code: "VIEWER", label: "Viewer" },
];

export async function listAdminStaff(req: Request, res: Response) {
  try {
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
      data: items.map((a) => ({
        id: a.id,
        email: a.email,
        fullName: a.fullName,
        isActive: a.isActive,
        role: a.role,
        roles: [{ code: ROLES.find((r) => r.name.toLowerCase() === a.role || r.code.toLowerCase() === a.role)?.code ?? "ADMIN" }],
        roleIds: [ROLES.find((r) => r.name.toLowerCase() === a.role || r.code.toLowerCase() === a.role)?.id ?? 2],
        createdAt: a.createdAt,
      })),
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
    const { email, password, fullName, isActive = true, roleIds } = req.body;
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "email, password, fullName required" });
    }
    const existing = await repo().findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: "Email already exists" });

    const roleId = Array.isArray(roleIds) ? roleIds[0] : roleIds;
    const role = ROLES.find((r) => r.id === Number(roleId))?.name ?? "admin";

    const admin = repo().create({
      email,
      fullName,
      passwordHash: await bcrypt.hash(password, 12),
      isActive: Boolean(isActive),
      role: role === "SUPER_ADMIN" ? "super_admin" : role.toLowerCase(),
    });
    await repo().save(admin);
    return res.status(201).json({ id: admin.id, email: admin.email, fullName: admin.fullName });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminStaff(req: Request, res: Response) {
  try {
    const admin = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!admin) return res.status(404).json({ message: "Not found" });

    const { fullName, email, isActive, roleIds, password } = req.body;
    if (fullName) admin.fullName = fullName;
    if (email) admin.email = email;
    if (isActive !== undefined) admin.isActive = Boolean(isActive);
    if (roleIds?.length) {
      const role = ROLES.find((r) => r.id === Number(roleIds[0]))?.name ?? "ADMIN";
      admin.role = role === "SUPER_ADMIN" ? "super_admin" : role.toLowerCase();
    }
    if (password) admin.passwordHash = await bcrypt.hash(password, 12);

    await repo().save(admin);
    return res.json({ id: admin.id });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminStaff(req: Request, res: Response) {
  try {
    await repo().delete({ id: routeParam(req, 'id') });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminStaffStatus(req: Request, res: Response) {
  try {
    const admin = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    admin.isActive = Boolean(req.body.isActive);
    await repo().save(admin);
    return res.json({ id: admin.id, isActive: admin.isActive });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetAdminStaffPassword(req: Request, res: Response) {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: "password required" });
    const admin = await repo().findOne({ where: { id: routeParam(req, 'id') } });
    if (!admin) return res.status(404).json({ message: "Not found" });
    admin.passwordHash = await bcrypt.hash(password, 12);
    await repo().save(admin);
    return res.json({ message: "Password updated" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function listAdminRoles(_req: Request, res: Response) {
  return res.json({ data: ROLES });
}

export async function listAdminPermissions(_req: Request, res: Response) {
  return res.json({
    data: [
      "campaigns:read",
      "campaigns:write",
      "donations:read",
      "donations:write",
      "cms:read",
      "cms:write",
      "charities:read",
      "charities:write",
      "users:read",
      "users:write",
      "analytics:read",
    ],
  });
}

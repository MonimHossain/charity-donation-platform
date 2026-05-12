import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";
import { logAudit } from "../../helper/auditLog.js";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "change-me";
const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES_IN ?? "7d";
const COOKIE_MAX_AGE = Number(process.env.ADMIN_COOKIE_MAX_AGE_MS ?? 604800000);

export async function loginAdmin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const repo = AppDataSource.getRepository(Admin);
    const admin = await repo.findOne({ where: { email } });
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
    });

    (req as any).admin = { id: admin.id, email: admin.email, role: admin.role };
    await logAudit(req, { action: "login", entityType: "admin", entityId: admin.id, details: { email: admin.email } });

    return res.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminProfile(req: Request, res: Response) {
  try {
    const adminId = (req as any).admin?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const repo = AppDataSource.getRepository(Admin);
    const admin = await repo.findOne({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    return res.json({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutAdmin(req: Request, res: Response) {
  await logAudit(req, { action: "logout", entityType: "admin", entityId: (req as any).admin?.id });
  res.clearCookie("admin_token");
  return res.json({ message: "Logged out" });
}

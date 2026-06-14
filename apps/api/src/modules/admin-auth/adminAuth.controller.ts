import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { signJwt } from "../../helper/jwt.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";
import { logAudit } from "../../helper/auditLog.js";

function requireDatabase(res: Response): boolean {
  if (!AppDataSource.isInitialized) {
    res.status(503).json({
      message: "Database is not connected. Start PostgreSQL and restart the API.",
    });
    return false;
  }
  return true;
}

const JWT_SECRET = process.env.ADMIN_JWT_SECRET ?? "change-me";
const JWT_EXPIRES = process.env.ADMIN_JWT_EXPIRES_IN ?? "7d";
const COOKIE_MAX_AGE = Number(process.env.ADMIN_COOKIE_MAX_AGE_MS ?? 604800000);

export async function loginAdmin(req: Request, res: Response) {
  try {
    if (!requireDatabase(res)) return;
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

    const token = signJwt(
      { id: admin.id, email: admin.email, role: admin.role },
      JWT_SECRET,
      JWT_EXPIRES
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
    if (!requireDatabase(res)) return;
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

export async function changeAdminPassword(req: Request, res: Response) {
  try {
    if (!requireDatabase(res)) return;
    const adminId = (req as any).admin?.id;
    if (!adminId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters" });
    }

    const repo = AppDataSource.getRepository(Admin);
    const admin = await repo.findOne({ where: { id: adminId } });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await repo.save(admin);

    await logAudit(req, {
      action: "change_password",
      entityType: "admin",
      entityId: admin.id,
    });

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("changeAdminPassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutAdmin(req: Request, res: Response) {
  await logAudit(req, { action: "logout", entityType: "admin", entityId: (req as any).admin?.id });
  res.clearCookie("admin_token");
  return res.json({ message: "Logged out" });
}

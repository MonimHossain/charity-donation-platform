import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { Admin } from "../../components/admin/admin.entity.js";
import { sendAdminPasswordResetEmail } from "../../helper/mailer.js";

const RESET_SECRET =
  process.env.ADMIN_RESET_SECRET ||
  process.env.ADMIN_JWT_SECRET ||
  "admin-reset-secret-dev";
const TOKEN_EXPIRY = "24h";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function signAdminResetToken(adminId: string, email: string): string {
  return jwt.sign({ adminId, email, purpose: "reset" }, RESET_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export function verifyAdminResetToken(token: string): { adminId: string; email: string } {
  const decoded = jwt.verify(token, RESET_SECRET) as {
    adminId?: string;
    email?: string;
    purpose?: string;
  };
  if (!decoded.adminId || !decoded.email || decoded.purpose !== "reset") {
    throw new Error("Invalid or expired token");
  }
  return { adminId: decoded.adminId, email: decoded.email };
}

export async function sendAdminPasswordResetForEmail(email: string): Promise<void> {
  const repo = AppDataSource.getRepository(Admin);
  const admin = await repo.findOne({ where: { email: normalizeEmail(email) } });
  if (!admin || !admin.isActive) return;

  const token = signAdminResetToken(admin.id, admin.email);
  await sendAdminPasswordResetEmail(admin.email, admin.fullName, token);
}

export async function resetAdminPassword(token: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const { adminId, email } = verifyAdminResetToken(token);
  const repo = AppDataSource.getRepository(Admin);
  const admin = await repo.findOne({ where: { id: adminId } });
  if (!admin || normalizeEmail(admin.email) !== normalizeEmail(email)) {
    throw new Error("Invalid or expired token");
  }

  admin.passwordHash = await bcrypt.hash(password, 12);
  await repo.save(admin);
}

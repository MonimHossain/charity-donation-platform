import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { User } from "../../components/user/user.entity.js";
import {
  findOrCreateDonorUser,
  issueUserSession,
  linkDonationsToUser,
  normalizeEmail,
  refreshUserDonationStats,
} from "./userAuth.service.js";
import {
  sendAccountActivationEmail,
  sendPasswordResetEmail,
} from "../../helper/mailer.js";
import type { Response } from "express";

const RESET_SECRET =
  process.env.USER_RESET_SECRET ||
  process.env.USER_JWT_SECRET ||
  "user-reset-secret-dev";
const TOKEN_EXPIRY = "24h";

export type DonorEmailStatus = "new" | "password" | "google" | "needs_password_setup";

export function resolveDonorEmailStatus(user: User | null): DonorEmailStatus {
  if (!user) return "new";
  if (user.passwordHash) return "password";
  if (user.authProvider === "google") return "google";
  return "needs_password_setup";
}

export async function checkDonorEmail(email: string): Promise<{ status: DonorEmailStatus }> {
  const repo = AppDataSource.getRepository(User);
  const normalized = normalizeEmail(email);
  const user = await repo.findOne({ where: { email: normalized } });
  return { status: resolveDonorEmailStatus(user) };
}

type TokenPurpose = "activate" | "reset";

function signAccessToken(userId: string, email: string, purpose: TokenPurpose): string {
  return jwt.sign({ userId, email, purpose }, RESET_SECRET, { expiresIn: TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string, purpose: TokenPurpose): { userId: string; email: string } {
  const decoded = jwt.verify(token, RESET_SECRET) as {
    userId?: string;
    email?: string;
    purpose?: string;
  };
  if (!decoded.userId || !decoded.email || decoded.purpose !== purpose) {
    throw new Error("Invalid or expired token");
  }
  return { userId: decoded.userId, email: decoded.email };
}

export async function requestDonorAccess(input: {
  email: string;
  fullName?: string;
}): Promise<{ message: string }> {
  const normalized = normalizeEmail(input.email);
  const repo = AppDataSource.getRepository(User);
  let user = await repo.findOne({ where: { email: normalized } });

  if (!user) {
    user = await findOrCreateDonorUser({
      email: normalized,
      fullName: input.fullName?.trim() || normalized.split("@")[0] || "Donor",
      authProvider: "local",
      emailVerified: false,
      passwordHash: null,
    });
  } else if (input.fullName?.trim() && !user.fullName) {
    user.fullName = input.fullName.trim();
    await repo.save(user);
  }

  const status = resolveDonorEmailStatus(user);
  if (status === "password" || status === "google") {
    return {
      message: "If an account with that email exists, a sign-in link has been sent.",
    };
  }

  const token = signAccessToken(user.id, user.email, "activate");
  await sendAccountActivationEmail(user.email, user.fullName, token);

  return {
    message: "If an account with that email exists, an activation link has been sent.",
  };
}

export async function activateAccount(
  res: Response,
  token: string,
  password: string
): Promise<{ token: string; user: ReturnType<typeof import("./userAuth.service.js").publicUser> }> {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const { userId, email } = verifyAccessToken(token, "activate");
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user || normalizeEmail(user.email) !== normalizeEmail(email)) {
    throw new Error("Invalid or expired token");
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  if (user.authProvider === "apple") {
    user.authProvider = "local";
  }
  user.emailVerified = true;
  user.lastLoginAt = new Date();
  await repo.save(user);
  await linkDonationsToUser(user.id, user.email);
  await refreshUserDonationStats(user.id);

  return issueUserSession(res, user);
}

export async function sendPasswordResetForEmail(email: string): Promise<void> {
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { email: normalizeEmail(email) } });
  if (!user || !user.isActive || !user.passwordHash) return;

  const token = signAccessToken(user.id, user.email, "reset");
  await sendPasswordResetEmail(user.email, user.fullName, token);
}

export async function resetAccountPassword(token: string, newPassword: string): Promise<void> {
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const { userId, email } = verifyAccessToken(token, "reset");
  const repo = AppDataSource.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user || normalizeEmail(user.email) !== normalizeEmail(email)) {
    throw new Error("Invalid or expired token");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await repo.save(user);
}

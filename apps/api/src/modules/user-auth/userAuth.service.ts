import type { Response } from "express";
import bcrypt from "bcryptjs";
import { signJwt } from "../../helper/jwt.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { User } from "../../components/user/user.entity.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { AutomatedDonationSchedule } from "../../components/automatedDonation/automatedDonation.entity.js";

const JWT_SECRET = process.env.USER_JWT_SECRET ?? "user-jwt-secret-dev";
const JWT_EXPIRES = process.env.USER_JWT_EXPIRES_IN ?? "7d";
const COOKIE_MAX_AGE = Number(process.env.USER_COOKIE_MAX_AGE_MS ?? 604800000);

export type AuthProvider = "local" | "google" | "apple";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    name: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    totalDonated: Number(user.totalDonated || 0),
    donationCount: user.donationCount || 0,
  };
}

export function createUserToken(user: User) {
  const token = signJwt(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    JWT_EXPIRES
  );
  return { token, user: publicUser(user) };
}

export function issueUserSession(res: Response, user: User) {
  const session = createUserToken(user);

  res.cookie("user_token", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  return session;
}

export async function linkDonationsToUser(userId: string, email: string): Promise<void> {
  const normalized = normalizeEmail(email);
  const donationRepo = AppDataSource.getRepository(Donation);
  const recurringRepo = AppDataSource.getRepository(RecurringDonation);

  await donationRepo
    .createQueryBuilder()
    .update(Donation)
    .set({ userId })
    .where("LOWER(donorEmail) = :email", { email: normalized })
    .andWhere("userId IS NULL")
    .execute();

  await recurringRepo
    .createQueryBuilder()
    .update(RecurringDonation)
    .set({ userId })
    .where("LOWER(donorEmail) = :email", { email: normalized })
    .andWhere("userId IS NULL")
    .execute();

  const automatedRepo = AppDataSource.getRepository(AutomatedDonationSchedule);
  await automatedRepo
    .createQueryBuilder()
    .update(AutomatedDonationSchedule)
    .set({ userId })
    .where("LOWER(donorEmail) = :email", { email: normalized })
    .andWhere("userId IS NULL")
    .execute();
}

export async function refreshUserDonationStats(userId: string): Promise<void> {
  const userRepo = AppDataSource.getRepository(User);
  const donationRepo = AppDataSource.getRepository(Donation);

  const stats = await donationRepo
    .createQueryBuilder("d")
    .select("COALESCE(SUM(d.totalAmount), 0)", "total")
    .addSelect("COUNT(*)", "count")
    .where("d.userId = :userId", { userId })
    .andWhere("d.status = :status", { status: "completed" })
    .getRawOne<{ total: string; count: string }>();

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) return;

  user.totalDonated = Number(stats?.total || 0);
  user.donationCount = Number(stats?.count || 0);
  await userRepo.save(user);
}

export async function findOrCreateDonorUser(input: {
  email: string;
  fullName: string;
  phone?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  authProvider?: AuthProvider;
  providerSubject?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  passwordHash?: string | null;
}): Promise<{ user: User; isNew: boolean }> {
  const repo = AppDataSource.getRepository(User);
  const email = normalizeEmail(input.email);
  let user = await repo.findOne({ where: { email } });
  let isNew = false;

  if (!user && input.providerSubject && input.authProvider && input.authProvider !== "local") {
    user = await repo.findOne({
      where: {
        authProvider: input.authProvider,
        providerSubject: input.providerSubject,
      },
    });
  }

  if (!user) {
    isNew = true;
    const unusablePassword =
      input.passwordHash ??
      (await bcrypt.hash(`${email}-${Date.now()}-${Math.random()}`, 12));

    user = repo.create({
      email,
      fullName: input.fullName.trim() || email.split("@")[0] || "Donor",
      passwordHash: input.passwordHash === null ? null : unusablePassword,
      phone: input.phone,
      marketingConsent: input.marketingConsent ?? false,
      smsConsent: input.smsConsent ?? false,
      authProvider: input.authProvider ?? "local",
      providerSubject: input.providerSubject,
      avatarUrl: input.avatarUrl,
      emailVerified: input.emailVerified ?? false,
      lastLoginAt: new Date(),
    });
    await repo.save(user);
  } else {
    if (input.fullName?.trim()) user.fullName = input.fullName.trim();
    if (input.phone) user.phone = input.phone;
    if (input.avatarUrl) user.avatarUrl = input.avatarUrl;
    if (input.emailVerified) user.emailVerified = true;
    if (input.authProvider && input.authProvider !== "local") {
      user.authProvider = input.authProvider;
      if (input.providerSubject) user.providerSubject = input.providerSubject;
    }
    user.lastLoginAt = new Date();
    await repo.save(user);
  }

  await linkDonationsToUser(user.id, email);
  await refreshUserDonationStats(user.id);
  return { user, isNew };
}

export async function ensureDonorUserForDonation(input: {
  donorEmail: string;
  donorName: string;
  donorPhone?: string;
  marketingConsent?: boolean;
  smsConsent?: boolean;
  existingUserId?: string;
}): Promise<User> {
  if (input.existingUserId) {
    const repo = AppDataSource.getRepository(User);
    const existing = await repo.findOne({ where: { id: input.existingUserId } });
    if (existing) {
      await linkDonationsToUser(existing.id, existing.email);
      return existing;
    }
  }

  const { user } = await findOrCreateDonorUser({
    email: input.donorEmail,
    fullName: input.donorName,
    phone: input.donorPhone,
    marketingConsent: input.marketingConsent,
    smsConsent: input.smsConsent,
    authProvider: "local",
    emailVerified: false,
    passwordHash: null,
  });
  return user;
}

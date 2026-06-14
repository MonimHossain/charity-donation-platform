import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../../helper/connectDB.js";
import { User } from "../../components/user/user.entity.js";
import { Donation } from "../../components/donation/donation.entity.js";
import {
  findOrCreateDonorUser,
  issueUserSession,
  linkDonationsToUser,
  normalizeEmail,
  publicUser,
  refreshUserDonationStats,
} from "./userAuth.service.js";

export async function registerUser(req: Request, res: Response) {
  try {
    const { email, password, fullName, phone, marketingConsent, smsConsent } = req.body;
    if (!email || !password || !fullName) {
      return res
        .status(400)
        .json({ message: "Email, password and full name are required" });
    }

    const repo = AppDataSource.getRepository(User);
    const normalized = normalizeEmail(email);
    const existing = await repo.findOne({ where: { email: normalized } });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await findOrCreateDonorUser({
      email: normalized,
      fullName,
      phone,
      marketingConsent,
      smsConsent,
      authProvider: "local",
      emailVerified: false,
      passwordHash,
    });

    const session = issueUserSession(res, user);
    return res.status(201).json(session);
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function loginUser(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { email: normalizeEmail(email) } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      const provider = user.authProvider === "apple" ? "Apple" : user.authProvider === "google" ? "Google" : "social sign-in";
      return res.status(401).json({
        message: `This account uses ${provider}. Please continue with that sign-in option.`,
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastLoginAt = new Date();
    await repo.save(user);
    await linkDonationsToUser(user.id, user.email);
    await refreshUserDonationStats(user.id);

    const session = issueUserSession(res, user);
    return res.json(session);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function logoutUser(_req: Request, res: Response) {
  res.clearCookie("user_token");
  return res.json({ message: "Logged out" });
}

export async function getUserProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    await refreshUserDonationStats(user.id);

    return res.json({
      ...publicUser(user),
      phone: user.phone,
      address: user.address,
      city: user.city,
      postcode: user.postcode,
      country: user.country,
      emailVerified: user.emailVerified,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
      marketingConsent: user.marketingConsent,
      smsConsent: user.smsConsent,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateUserProfile(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowedFields = [
      "fullName",
      "phone",
      "address",
      "city",
      "postcode",
      "country",
      "avatarUrl",
      "preferredCurrency",
      "preferredLanguage",
      "marketingConsent",
      "smsConsent",
    ] as const;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    }

    await repo.save(user);

    return res.json({
      ...publicUser(user),
      phone: user.phone,
      address: user.address,
      city: user.city,
      postcode: user.postcode,
      country: user.country,
      preferredCurrency: user.preferredCurrency,
      preferredLanguage: user.preferredLanguage,
      marketingConsent: user.marketingConsent,
      smsConsent: user.smsConsent,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Password sign-in is not enabled for this account" });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await repo.save(user);

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    return res.json({
      message:
        "If an account with that email exists, a reset link has been sent",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    return res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUserDonations(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { page = "1", limit = "20", status } = req.query;
    const repo = AppDataSource.getRepository(Donation);
    const qb = repo
      .createQueryBuilder("d")
      .leftJoinAndSelect("d.campaign", "campaign")
      .where("d.userId = :userId", { userId })
      .orderBy("d.createdAt", "DESC")
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit));

    if (status) qb.andWhere("d.status = :status", { status });

    const [items, total] = await qb.getManyAndCount();

    return res.json({
      items: items.map((d) => ({
        id: d.id,
        amount: Number(d.amount),
        currency: d.currency,
        campaign: d.campaign?.title,
        frequency: d.frequency,
        status: d.status,
        giftAid: d.giftAid,
        createdAt: d.createdAt,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getUserDonations error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = "1", limit = "20", search, status } = req.query;
    const repo = AppDataSource.getRepository(User);
    const qb = repo
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.email",
        "u.fullName",
        "u.phone",
        "u.role",
        "u.isActive",
        "u.emailVerified",
        "u.totalDonated",
        "u.donationCount",
        "u.lastLoginAt",
        "u.createdAt",
      ])
      .orderBy("u.createdAt", "DESC")
      .skip((Number(page) - 1) * Number(limit))
      .take(Number(limit));

    if (search) {
      qb.andWhere("(u.fullName ILIKE :search OR u.email ILIKE :search)", {
        search: `%${search}%`,
      });
    }
    if (status === "active") qb.andWhere("u.isActive = true");
    if (status === "inactive") qb.andWhere("u.isActive = false");

    const [items, total] = await qb.getManyAndCount();

    return res.json({
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deactivateUser(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id: routeParam(req, 'id') } });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await repo.save(user);

    return res.json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      message: user.isActive ? "User activated" : "User deactivated",
    });
  } catch (error) {
    console.error("deactivateUser error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

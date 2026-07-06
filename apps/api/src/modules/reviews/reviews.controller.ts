import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Testimonial, type ReviewStatus } from "../../components/testimonial/testimonial.entity.js";
import { User } from "../../components/user/user.entity.js";
import { routeParam } from "../../helper/requestParams.js";
import { createEntity } from "../../helper/typeorm.js";
import { logAudit } from "../../helper/auditLog.js";

function clampRating(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function applyVisibilityFromStatus(row: Testimonial) {
  row.isVisible = row.status === "approved";
}

export async function submitReview(req: Request, res: Response) {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const { quote, rating, name, location } = req.body as {
      quote?: string;
      rating?: number;
      name?: string;
      location?: string;
    };

    if (!quote?.trim()) {
      return res.status(400).json({ message: "Review text is required" });
    }

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const repo = AppDataSource.getRepository(Testimonial);
    const review = repo.create({
      name: name?.trim() || user.fullName || "Donor",
      quote: quote.trim(),
      rating: clampRating(rating),
      status: "pending",
      source: "donor",
      userId,
      location: location?.trim() || undefined,
      role: location?.trim() ? `${location.trim()} · Donor` : "Donor",
      isVisible: false,
    });
    await repo.save(review);
    return res.status(201).json(review);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getMyReviews(req: Request, res: Response) {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });

    const reviews = await AppDataSource.getRepository(Testimonial).find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    return res.json(reviews);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminReviews(req: Request, res: Response) {
  try {
    const status = String(req.query.status || "all");
    const repo = AppDataSource.getRepository(Testimonial);
    const where =
      status === "all" || !status
        ? {}
        : { status: status as ReviewStatus };
    const reviews = await repo.find({
      where,
      order: { createdAt: "DESC" },
    });
    return res.json({ items: reviews });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminReview(req: Request, res: Response) {
  try {
    const { name, role, location, quote, rating } = req.body as {
      name?: string;
      role?: string;
      quote?: string;
      rating?: number;
      location?: string;
    };

    if (!name?.trim() || !quote?.trim()) {
      return res.status(400).json({ message: "Name and review text are required" });
    }

    const repo = AppDataSource.getRepository(Testimonial);
    const review = createEntity(repo, {
      name: name.trim(),
      role: role?.trim() || (location?.trim() ? `${location.trim()} · Donor` : "Donor"),
      location: location?.trim() || undefined,
      quote: quote.trim(),
      rating: clampRating(rating),
      status: "approved",
      source: "admin",
      isVisible: true,
    });
    await repo.save(review);
    await logAudit(req, { action: "create", entityType: "review", entityId: review.id });
    return res.status(201).json(review);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminReview(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(Testimonial);
    const review = await repo.findOne({ where: { id: routeParam(req, "id") } });
    if (!review) return res.status(404).json({ message: "Review not found" });

    const body = req.body as Partial<Testimonial> & { status?: ReviewStatus };
    if (body.name !== undefined) review.name = String(body.name).trim();
    if (body.role !== undefined) review.role = body.role;
    if (body.location !== undefined) review.location = body.location;
    if (body.quote !== undefined) review.quote = String(body.quote).trim();
    if (body.rating !== undefined) review.rating = clampRating(body.rating);
    if (body.status !== undefined) review.status = body.status;
    if (body.sortOrder !== undefined) review.sortOrder = Number(body.sortOrder) || 0;

    applyVisibilityFromStatus(review);
    await repo.save(review);
    await logAudit(req, { action: "update", entityType: "review", entityId: review.id });
    return res.json(review);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminReview(req: Request, res: Response) {
  try {
    const id = routeParam(req, "id");
    const result = await AppDataSource.getRepository(Testimonial).delete(id);
    if (result.affected === 0) return res.status(404).json({ message: "Review not found" });
    await logAudit(req, { action: "delete", entityType: "review", entityId: id });
    return res.json({ message: "Review deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

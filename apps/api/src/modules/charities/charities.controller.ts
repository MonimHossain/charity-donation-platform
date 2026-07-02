import { Request, Response } from "express";
import { createEntity } from "../../helper/typeorm.js";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Charity } from "../../components/charity/charity.entity.js";
import { Certification } from "../../components/charity/certification.entity.js";
import { ContactMessage } from "../../components/charity/contactMessage.entity.js";
import { ConcernReport } from "../../components/charity/concernReport.entity.js";
import { ApplyReviewSubmission } from "../../components/charity/applyReview.entity.js";
import { ILike } from "typeorm";
import { logAudit } from "../../helper/auditLog.js";

const charityRepo = () => AppDataSource.getRepository(Charity);
const certRepo = () => AppDataSource.getRepository(Certification);

function daysUntil(dateStr: string): number {
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function mapCertification(cert: Certification) {
  const expired = daysUntil(cert.expiryDate) < 0;
  const days = daysUntil(cert.expiryDate);
  return {
    id: cert.id,
    certificateId: cert.certificateId,
    status: cert.status,
    issueDate: cert.issueDate,
    expiryDate: cert.expiryDate,
    certificationYear: cert.certificationYear,
    badgeEnabled: cert.badgeEnabled,
    badgeActive: cert.badgeEnabled && cert.status === "active" && !expired,
    isCurrent: cert.status === "active" && !expired,
    isExpired: expired,
    daysUntilExpiry: days,
  };
}

function getActiveCert(charity: Charity): Certification | undefined {
  const certs = charity.certifications || [];
  return certs.find((c) => c.status === "active") ?? certs[0];
}

function mapPublicListItem(charity: Charity) {
  const active = getActiveCert(charity);
  return {
    id: charity.id,
    name: charity.name,
    slug: charity.slug,
    country: charity.country,
    logoUrl: charity.logoUrl,
    auditStatus: charity.auditStatus,
    auditDate: charity.auditDate,
    isFeatured: charity.isFeatured,
    certification: active ? mapCertification(active) : null,
  };
}

function mapPublicDetail(charity: Charity) {
  const active = getActiveCert(charity);
  return {
    id: charity.id,
    name: charity.name,
    slug: charity.slug,
    country: charity.country,
    websiteUrl: charity.websiteUrl,
    logoUrl: charity.logoUrl,
    shortDescription: charity.shortDescription,
    auditStatus: charity.auditStatus,
    auditSummary: charity.auditSummary,
    auditDate: charity.auditDate,
    overallScore: charity.overallScore,
    riskLevel: charity.riskLevel,
    scoreBreakdown: charity.scoreBreakdown,
    isFeatured: charity.isFeatured,
    certification: active ? mapCertification(active) : null,
    certifications: (charity.certifications || []).map(mapCertification),
  };
}

export async function getPublicCharities(req: Request, res: Response) {
  try {
    const { search, country, page = "1", limit = "12", featured } = req.query;
    const where: Record<string, unknown> = { isPublished: true };
    if (country) where.country = country;
    if (featured === "true") where.isFeatured = true;
    if (search) where.name = ILike(`%${search}%`);

    const [items, total] = await charityRepo().findAndCount({
      where,
      relations: ["certifications"],
      order: { isFeatured: "DESC", name: "ASC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const data = items.map(mapPublicListItem);
    const totalPages = Math.ceil(total / Number(limit)) || 1;
    return res.json({
      data,
      items: data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages,
    });
  } catch (error) {
    console.error("getPublicCharities:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getFeaturedCharities(_req: Request, res: Response) {
  try {
    const items = await charityRepo().find({
      where: { isPublished: true, isFeatured: true },
      relations: ["certifications"],
      take: 6,
      order: { name: "ASC" },
    });
    return res.json(items.map(mapPublicListItem));
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublicCharityBySlug(req: Request, res: Response) {
  try {
    const charity = await charityRepo().findOne({
      where: { slug: routeParam(req, 'slug'), isPublished: true },
      relations: ["certifications"],
    });
    if (!charity) return res.status(404).json({ message: "Charity not found" });
    return res.json(mapPublicDetail(charity));
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function verifyCertification(req: Request, res: Response) {
  try {
    const { certificateId, charityName } = req.query;
    if (!certificateId && !charityName) {
      return res.status(400).json({ message: "certificateId or charityName required" });
    }

    let cert: Certification | null = null;
    if (certificateId) {
      cert = await certRepo().findOne({
        where: { certificateId: String(certificateId) },
        relations: ["charity", "charity.certifications"],
      });
    }

    if (!cert) {
      return res.json({ valid: false, message: "Certificate not found" });
    }

    const mapped = mapCertification(cert);
    const charityItem = cert.charity
      ? {
          ...mapPublicListItem(cert.charity),
          certification: mapped,
        }
      : null;
    return res.json({
      valid: mapped.isCurrent,
      charity: charityItem,
      certification: mapped,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function verifyCertificationById(req: Request, res: Response) {
  req.query.certificateId = routeParam(req, 'certificateId');
  return verifyCertification(req, res);
}

export async function submitContactMessage(req: Request, res: Response) {
  try {
    if (!AppDataSource.isInitialized) {
      return res.status(503).json({
        message: "Database is not connected. Start PostgreSQL and restart the API.",
      });
    }

    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const subject = String(req.body?.subject ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "A valid email address is required" });
    }
    if (message.length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters" });
    }

    const repo = AppDataSource.getRepository(ContactMessage);
    const row = repo.create({ name, email, subject, message, submissionStatus: "NEW" });
    await repo.save(row);

    try {
      const { dispatchEvent } = await import("../notifications/notification.service.js");
      void dispatchEvent("admin_alert", {
        title: "New contact message",
        body: `${name} (${email}): ${subject}`,
        actionUrl: "/admin/contact-messages",
      });
    } catch (notifyErr) {
      console.error("submitContactMessage notification error:", notifyErr);
    }

    return res.status(201).json({ message: "Message received", id: row.id });
  } catch (error) {
    console.error("submitContactMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function submitConcern(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ConcernReport);
    const row = createEntity(repo, req.body);
    await repo.save(row);
    return res.status(201).json({ message: "Concern submitted", id: row.id });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function submitApplyReview(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ApplyReviewSubmission);
    const row = createEntity(repo, { ...req.body, status: "pending"  });
    await repo.save(row);
    return res.status(201).json({ message: "Application submitted", id: row.id });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublicStats(_req: Request, res: Response) {
  try {
    const total = await charityRepo().count({ where: { isPublished: true } });
    const certified = await certRepo().count({ where: { status: "active" } });

    const { Donation } = await import("../../components/donation/donation.entity.js");
    const donationRepo = AppDataSource.getRepository(Donation);
    const agg = await donationRepo
      .createQueryBuilder("d")
      .select("COUNT(*)", "donationCount")
      .addSelect("COALESCE(SUM(d.totalAmount), 0)", "totalRaised")
      .where("d.status = :status", { status: "completed" })
      .getRawOne<{ donationCount: string; totalRaised: string }>();

    const donationCount = Number(agg?.donationCount || 0);
    const totalRaised = Number(agg?.totalRaised || 0);

    const impactStats = [
      { value: String(total), label: "Charities listed" },
      { value: String(certified), label: "Active certifications" },
      {
        value: totalRaised >= 1_000_000 ? `£${(totalRaised / 1_000_000).toFixed(1)}M+` : `£${Math.round(totalRaised).toLocaleString()}`,
        label: "Raised through platform",
      },
      { value: donationCount > 0 ? `${donationCount.toLocaleString()}+` : "0", label: "Donations completed" },
    ];

    return res.json({
      charitiesListed: total,
      activeCertifications: certified,
      donationCount,
      totalRaised,
      impactStats,
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminCharities(req: Request, res: Response) {
  try {
    const { search, page = "1", limit = "20" } = req.query;
    const where: Record<string, unknown> = {};
    if (search) where.name = ILike(`%${search}%`);

    const [items, total] = await charityRepo().findAndCount({
      where,
      relations: ["certifications"],
      order: { createdAt: "DESC" },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    return res.json({
      data: items.map(mapPublicDetail),
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminCharityById(req: Request, res: Response) {
  try {
    const charity = await charityRepo().findOne({
      where: { id: Number(routeParam(req, 'id')) },
      relations: ["certifications"],
    });
    if (!charity) return res.status(404).json({ message: "Not found" });
    return res.json(mapPublicDetail(charity));
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminCharity(req: Request, res: Response) {
  try {
    const charity = createEntity(charityRepo(), req.body);
    await charityRepo().save(charity);
    await logAudit(req, { action: "create", entityType: "charity", entityId: String(charity.id), details: { name: charity.name } });
    return res.status(201).json(charity);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminCharity(req: Request, res: Response) {
  try {
    const charity = await charityRepo().findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!charity) return res.status(404).json({ message: "Not found" });
    Object.assign(charity, req.body);
    await charityRepo().save(charity);
    await logAudit(req, {
      action: "update",
      entityType: "charity",
      entityId: String(charity.id),
      details: { name: charity.name },
    });
    return res.json(charity);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminCharity(req: Request, res: Response) {
  try {
    const charity = await charityRepo().findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!charity) return res.status(404).json({ message: "Not found" });
    await charityRepo().delete({ id: charity.id });
    await logAudit(req, {
      action: "delete",
      entityType: "charity",
      entityId: String(charity.id),
      details: { name: charity.name },
    });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminCertifications(req: Request, res: Response) {
  try {
    const certs = await certRepo().find({
      relations: ["charity"],
      order: { createdAt: "DESC" },
      take: Number(req.query.limit ?? 50),
    });
    return res.json({
      data: certs.map((c) => ({
        ...mapCertification(c),
        charityId: c.charityId,
        charityName: c.charity?.name,
      })),
    });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminCertificationById(req: Request, res: Response) {
  try {
    const cert = await certRepo().findOne({
      where: { id: Number(routeParam(req, 'id')) },
      relations: ["charity"],
    });
    if (!cert) return res.status(404).json({ message: "Not found" });
    return res.json({ ...mapCertification(cert), charity: cert.charity });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function createAdminCertification(req: Request, res: Response) {
  try {
    const cert = createEntity(certRepo(), req.body);
    await certRepo().save(cert);
    await logAudit(req, {
      action: "create",
      entityType: "certification",
      entityId: String(cert.id),
      details: { name: cert.certificateId || `Cert #${cert.id}` },
    });
    return res.status(201).json(cert);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminCertification(req: Request, res: Response) {
  try {
    const cert = await certRepo().findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!cert) return res.status(404).json({ message: "Not found" });
    Object.assign(cert, req.body);
    await certRepo().save(cert);
    await logAudit(req, {
      action: "update",
      entityType: "certification",
      entityId: String(cert.id),
      details: { name: cert.certificateId || `Cert #${cert.id}` },
    });
    return res.json(cert);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminCertification(req: Request, res: Response) {
  try {
    const cert = await certRepo().findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!cert) return res.status(404).json({ message: "Not found" });
    await certRepo().delete({ id: cert.id });
    await logAudit(req, {
      action: "delete",
      entityType: "certification",
      entityId: String(cert.id),
      details: { name: cert.certificateId || `Cert #${cert.id}` },
    });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminConcerns(_req: Request, res: Response) {
  try {
    const items = await AppDataSource.getRepository(ConcernReport).find({
      order: { createdAt: "DESC" },
      take: 100,
    });
    return res.json({ data: items });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminApplyReview(req: Request, res: Response) {
  try {
    const items = await AppDataSource.getRepository(ApplyReviewSubmission).find({
      order: { createdAt: "DESC" },
      take: Number(req.query.limit ?? 50),
    });
    return res.json({ data: items });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminApplyReview(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ApplyReviewSubmission);
    const row = await repo.findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!row) return res.status(404).json({ message: "Not found" });
    Object.assign(row, req.body);
    await repo.save(row);
    await logAudit(req, {
      action: "update",
      entityType: "apply_review",
      entityId: String(row.id),
      details: { name: row.charityName || row.contactName || `Submission #${row.id}` },
    });
    return res.json(row);
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminApplyReview(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ApplyReviewSubmission);
    const row = await repo.findOne({ where: { id: Number(routeParam(req, 'id')) } });
    if (!row) return res.status(404).json({ message: "Not found" });
    await repo.delete({ id: row.id });
    await logAudit(req, {
      action: "delete",
      entityType: "apply_review",
      entityId: String(row.id),
      details: { name: row.charityName || row.contactName || `Submission #${row.id}` },
    });
    return res.json({ message: "Deleted" });
  } catch {
    return res.status(500).json({ message: "Internal server error" });
  }
}

function mapContactMessage(row: ContactMessage) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    submissionStatus: (row.submissionStatus || "NEW").toUpperCase(),
    internalNotes: row.internalNotes ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function getAdminContactMessages(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 25)));
    const repo = AppDataSource.getRepository(ContactMessage);
    const [items, total] = await repo.findAndCount({
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.json({
      data: items.map(mapContactMessage),
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    console.error("getAdminContactMessages error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAdminContactMessage(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ContactMessage);
    const row = await repo.findOne({ where: { id: routeParam(req, "id") } });
    if (!row) return res.status(404).json({ message: "Not found" });

    const { submissionStatus, internalNotes } = req.body ?? {};
    if (submissionStatus !== undefined) {
      row.submissionStatus = String(submissionStatus).trim() || row.submissionStatus;
    }
    if (internalNotes !== undefined) {
      row.internalNotes =
        internalNotes === null || String(internalNotes).trim() === ""
          ? null
          : String(internalNotes).trim();
    }

    await repo.save(row);
    await logAudit(req, {
      action: "update",
      entityType: "contact_message",
      entityId: row.id,
      details: { name: row.name, subject: row.subject },
    });
    return res.json(mapContactMessage(row));
  } catch (error) {
    console.error("updateAdminContactMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAdminContactMessage(req: Request, res: Response) {
  try {
    const repo = AppDataSource.getRepository(ContactMessage);
    const row = await repo.findOne({ where: { id: routeParam(req, "id") } });
    if (!row) return res.status(404).json({ message: "Not found" });
    await repo.delete({ id: row.id });
    await logAudit(req, {
      action: "delete",
      entityType: "contact_message",
      entityId: row.id,
      details: { name: row.name, subject: row.subject },
    });
    return res.json({ message: "Deleted" });
  } catch (error) {
    console.error("deleteAdminContactMessage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPublicExperts(_req: Request, res: Response) {
  return res.json([]);
}

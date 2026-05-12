import { Request } from "express";
import { AppDataSource } from "./connectDB.js";
import { AuditLog } from "../components/auditLog/auditLog.entity.js";

interface AuditEntry {
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function logAudit(req: Request, entry: AuditEntry) {
  try {
    const admin = (req as any).admin;
    const repo = AppDataSource.getRepository(AuditLog);
    const log = repo.create({
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      userId: admin?.id,
      userEmail: admin?.email,
      userRole: admin?.role || "admin",
      ipAddress: req.ip || req.socket.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
      details: entry.details,
    });
    await repo.save(log);
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}

import { AuditLog } from "../components/auditLog/auditLog.entity.js";

const ENTITY_LABELS: Record<string, string> = {
  admin: "Admin account",
  campaign: "Campaign",
  blog_post: "Blog post",
  charity: "Charity",
  certification: "Certification",
  donation: "Donation",
  donation_page: "Donation page",
  hero_slide: "Hero slide",
  homepage_section: "Homepage section",
  site_settings: "Site settings",
  donation_preset: "Donation preset",
  quick_donate_option: "Quick donate option",
  quick_donate_settings: "Quick donate settings",
  media: "Media file",
  automated_schedule: "Automated schedule",
  apply_review: "Apply review",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function entityLabel(entityType?: string) {
  if (!entityType) return "Record";
  return ENTITY_LABELS[entityType] || capitalize(entityType.replace(/_/g, " "));
}

export function formatAuditDetails(log: AuditLog): string {
  const action = log.action.replace(/_/g, " ");
  const entity = entityLabel(log.entityType);
  const d = log.details || {};

  if (log.action === "login" && d.email) {
    return `Logged in as ${d.email}`;
  }
  if (log.action === "logout") {
    return "Logged out";
  }
  if (log.action === "change_password") {
    return "Changed account password";
  }
  if (log.action === "refund" && d.donorEmail) {
    const amount = d.amount != null ? ` (£${Number(d.amount).toFixed(2)})` : "";
    return `Refunded donation${amount} for ${d.donorEmail}`;
  }
  if (log.action === "export") {
    const count = d.count != null ? `${d.count} records` : "donations";
    return `Exported ${count}`;
  }
  if (log.action === "upload" && d.filename) {
    return `Uploaded "${d.filename}"${d.folder ? ` to ${d.folder}` : ""}`;
  }
  if (log.action === "upload_batch" && d.count) {
    return `Uploaded ${d.count} file(s)${d.folder ? ` to ${d.folder}` : ""}`;
  }
  if (log.action === "bulk_delete" && d.count) {
    return `Deleted ${d.count} media file(s)`;
  }
  if (log.action === "delete" && d.filename) {
    return `Deleted "${d.filename}"`;
  }
  if (log.action === "reorder") {
    return `Reordered ${entity.toLowerCase()}s`;
  }
  if (log.action === "cancel" && d.donorEmail) {
    return `Cancelled automated schedule for ${d.donorEmail}`;
  }
  if (typeof d.title === "string" && d.title) {
    return `${capitalize(action)} ${entity.toLowerCase()} "${d.title}"`;
  }
  if (typeof d.name === "string" && d.name) {
    return `${capitalize(action)} ${entity.toLowerCase()} "${d.name}"`;
  }

  const idHint = log.entityId ? ` (${log.entityId.slice(0, 8)}…)` : "";
  return `${capitalize(action)} ${entity.toLowerCase()}${idHint}`;
}

export function mapAuditLogForClient(log: AuditLog) {
  return {
    id: log.id,
    action: log.action,
    user: log.userEmail || log.userId || "System",
    userEmail: log.userEmail,
    userRole: log.userRole,
    details: formatAuditDetails(log),
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress || "",
    createdAt: log.createdAt,
  };
}

export function parseDateFilter(value: string, endOfDay = false): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (endOfDay) {
      date.setUTCHours(23, 59, 59, 999);
    }
    return date;
  }
  return new Date(value);
}

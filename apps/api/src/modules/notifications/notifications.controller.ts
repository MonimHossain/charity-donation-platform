import { Request, Response } from "express";
import { IsNull } from "typeorm";
import { routeParam } from "../../helper/requestParams.js";
import { AppDataSource } from "../../helper/connectDB.js";
import { Notification } from "../../components/notification/notification.entity.js";

const repo = () => AppDataSource.getRepository(Notification);

function getRecipient(req: Request): { type: "user" | "admin"; id: string } | null {
  const user = (req as any).user;
  const admin = (req as any).admin;
  if (user?.id) return { type: "user", id: user.id };
  if (admin?.id) return { type: "admin", id: admin.id };
  return null;
}

export async function listNotifications(req: Request, res: Response) {
  const recipient = getRecipient(req);
  if (!recipient) return res.status(401).json({ message: "Unauthorized" });

  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const unreadOnly = req.query.unread === "true";

  const where: Record<string, unknown> = {
    recipientType: recipient.type,
    recipientId: recipient.id,
  };
  if (unreadOnly) where.readAt = IsNull();

  const [items, total] = await repo().findAndCount({
    where: where as any,
    order: { createdAt: "DESC" },
    take: limit,
  });

  return res.json({ items, total });
}

export async function getUnreadCount(req: Request, res: Response) {
  const recipient = getRecipient(req);
  if (!recipient) return res.status(401).json({ message: "Unauthorized" });

  const count = await repo().count({
    where: {
      recipientType: recipient.type,
      recipientId: recipient.id,
      readAt: IsNull(),
    },
  });

  return res.json({ count });
}

export async function markNotificationRead(req: Request, res: Response) {
  const recipient = getRecipient(req);
  if (!recipient) return res.status(401).json({ message: "Unauthorized" });

  const notification = await repo().findOne({ where: { id: routeParam(req, "id") } });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  if (
    notification.recipientType !== recipient.type ||
    notification.recipientId !== recipient.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  notification.readAt = new Date();
  await repo().save(notification);
  return res.json(notification);
}

export async function markAllNotificationsRead(req: Request, res: Response) {
  const recipient = getRecipient(req);
  if (!recipient) return res.status(401).json({ message: "Unauthorized" });

  await repo().update(
    {
      recipientType: recipient.type,
      recipientId: recipient.id,
      readAt: IsNull(),
    },
    { readAt: new Date() }
  );

  return res.json({ message: "All notifications marked as read" });
}

"use client";

import {
  fetchAdminNotificationUnreadCount,
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/api";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function AdminNotificationBell() {
  return (
    <NotificationBell
      variant="admin"
      inboxHref="/admin/notifications"
      fetchNotifications={fetchAdminNotifications}
      fetchUnreadCount={fetchAdminNotificationUnreadCount}
      markRead={markAdminNotificationRead}
      markAllRead={markAllAdminNotificationsRead}
    />
  );
}

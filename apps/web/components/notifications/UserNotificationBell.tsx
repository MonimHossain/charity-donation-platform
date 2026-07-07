"use client";

import {
  fetchNotificationUnreadCount,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function UserNotificationBell() {
  return (
    <NotificationBell
      variant="user"
      inboxHref="/account/notifications"
      fetchNotifications={fetchNotifications}
      fetchUnreadCount={fetchNotificationUnreadCount}
      markRead={markNotificationRead}
      markAllRead={markAllNotificationsRead}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  readAt?: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  variant: "user" | "admin";
  inboxHref: string;
  fetchNotifications: (params?: Record<string, string>) => Promise<{ items: NotificationItem[] }>;
  fetchUnreadCount: () => Promise<{ count: number }>;
  markRead: (id: string) => Promise<unknown>;
  markAllRead: () => Promise<unknown>;
}

export function NotificationBell({
  variant,
  inboxHref,
  fetchNotifications,
  fetchUnreadCount,
  markRead,
  markAllRead,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setCount(res.count || 0);
    } catch {
      /* ignore */
    }
  }, [fetchUnreadCount]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchNotifications({ limit: "10" });
      setItems(res.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [fetchNotifications]);

  useEffect(() => {
    void loadCount();
    const interval = setInterval(loadCount, 60000);
    const onFocus = () => void loadCount();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadCount]);

  useEffect(() => {
    if (open) void loadItems();
  }, [open, loadItems]);

  async function handleMarkRead(id: string) {
    await markRead(id);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    );
    setCount((c) => Math.max(0, c - 1));
  }

  async function handleMarkAllRead() {
    await markAllRead();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    setCount(0);
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative rounded-xl"
        aria-label="Notifications"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-semibold text-sm">Notifications</p>
              {count > 0 && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => void handleMarkAllRead()}
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">Loading...</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No notifications</p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "border-b px-4 py-3 last:border-b-0",
                      !item.readAt && "bg-primary/5"
                    )}
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.body}</p>
                    <div className="mt-2 flex gap-2">
                      {item.actionUrl && (
                        <Link
                          href={item.actionUrl}
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            if (!item.readAt) void handleMarkRead(item.id);
                            setOpen(false);
                          }}
                        >
                          View
                        </Link>
                      )}
                      {!item.readAt && (
                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:underline"
                          onClick={() => void handleMarkRead(item.id)}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t px-4 py-2">
              <Link
                href={inboxHref}
                className="text-xs text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

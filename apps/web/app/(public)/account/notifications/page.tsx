"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  actionUrl?: string;
  readAt?: string | null;
  createdAt: string;
}

export default function AccountNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchNotifications({ limit: "50" });
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-primary">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Your account activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void markAllNotificationsRead().then(load)}>
          Mark all read
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No notifications yet</p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                "rounded-2xl border border-border bg-card p-4",
                !item.readAt && "border-primary/30 bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.body}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {item.actionUrl && (
                    <Button asChild variant="outline" size="sm">
                      <Link href={item.actionUrl}>View</Link>
                    </Button>
                  )}
                  {!item.readAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void markNotificationRead(item.id).then(load)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

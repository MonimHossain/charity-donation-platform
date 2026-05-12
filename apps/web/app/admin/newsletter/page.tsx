"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Mail, Users, Loader2 } from "lucide-react";
import { fetchNewsletterSubscribers } from "@/lib/api";

interface Subscriber {
  id?: string;
  email: string;
  name?: string;
  subscribedAt?: string;
  createdAt?: string;
  isActive?: boolean;
  status?: string;
}

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNewsletterSubscribers();
        const items = Array.isArray(data) ? data : data.items || data.subscribers || [];
        setSubscribers(items);
      } catch {
        toast.error("Failed to load subscribers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function isActive(s: Subscriber) {
    if (s.status) return s.status === "active";
    return s.isActive ?? true;
  }

  const filtered = subscribers.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter(isActive).length;

  function handleExport() {
    const csv = [
      "Email,Name,Date,Status",
      ...subscribers.map(
        (s) =>
          `${s.email},${s.name || ""},${s.subscribedAt || s.createdAt || ""},${isActive(s) ? "Active" : "Inactive"}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="rounded-2xl border bg-card p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading subscribers...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Newsletter Subscribers</h1>
          <p className="text-sm text-muted-foreground mt-1">{subscribers.length} total subscribers</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-full">
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{subscribers.length}</p>
              <p className="text-xs text-muted-foreground">Total Subscribers</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search subscribers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full" />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_120px_100px] gap-3 px-4 py-3 bg-secondary/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Email</span>
          <span>Name</span>
          <span>Date</span>
          <span>Status</span>
        </div>
        {filtered.map((subscriber) => {
          const active = isActive(subscriber);
          return (
            <div key={subscriber.id || subscriber.email} className="grid grid-cols-[1fr_1fr_120px_100px] gap-3 px-4 py-3 border-t border-border items-center">
              <span className="text-sm font-medium">{subscriber.email}</span>
              <span className="text-sm text-muted-foreground">{subscriber.name || "—"}</span>
              <span className="text-sm text-muted-foreground">
                {subscriber.subscribedAt || subscriber.createdAt
                  ? new Date(subscriber.subscribedAt || subscriber.createdAt || "").toLocaleDateString()
                  : "—"}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {active ? "Active" : "Inactive"}
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-muted-foreground border-t">
            No subscribers found
          </div>
        )}
      </div>
    </div>
  );
}

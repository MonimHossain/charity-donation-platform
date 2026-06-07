"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SubmissionStatusBadge } from "@/components/common/SubmissionStatusBadge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface RecentSubmission {
  id: number;
  type: string;
  title: string;
  status: string;
  createdAt: string;
}

interface Props {
  items: RecentSubmission[];
  loading?: boolean;
}

export function RecentSubmissionsTable({ items, loading }: Props) {
  return (
    <div className="rounded-2xl border bg-card shadow-soft">
      <div className="flex items-center justify-between p-5">
        <div>
          <h3 className="text-lg font-serif font-bold text-foreground">Recent Submissions</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Applications, concerns, and contact messages</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/applications">
            View All <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <Separator />
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">No recent submissions.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{item.type}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{item.title}</td>
                  <td className="px-5 py-3">
                    <SubmissionStatusBadge status={item.status as any} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

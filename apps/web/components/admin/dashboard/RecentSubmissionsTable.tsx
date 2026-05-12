"use client";

import { SubmissionStatusBadge } from "@/components/common/SubmissionStatusBadge";

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
    <div className="col-span-2 rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Recent Submissions</h3>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No recent submissions.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Title</th>
                <th className="py-2 text-left">Status</th>
                <th className="py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="border-b hover:bg-muted/50">
                  <td className="py-2 text-muted-foreground">{item.type}</td>
                  <td className="py-2 font-medium text-foreground">{item.title}</td>
                  <td className="py-2">
                    <SubmissionStatusBadge status={item.status as any} />
                  </td>
                  <td className="py-2 text-muted-foreground">
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

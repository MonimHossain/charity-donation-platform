"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchEmailLogs } from "@/lib/api";

interface LogRow {
  id: string;
  templateKey?: string;
  recipientEmail: string;
  subject: string;
  status: string;
  error?: string;
  sentAt: string;
}

export default function EmailLogsPage() {
  const [items, setItems] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchEmailLogs({ page: String(page), limit: "25" });
        setItems(res.items || []);
        setTotalPages(res.totalPages || 1);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [page]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Email Logs</h1>
        <p className="text-muted-foreground mt-1">Audit trail of sent, failed, and skipped emails</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left px-4 py-3">Time</th>
                  <th className="text-left px-4 py-3">To</th>
                  <th className="text-left px-4 py-3">Template</th>
                  <th className="text-left px-4 py-3">Subject</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(log.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{log.recipientEmail}</td>
                    <td className="px-4 py-3 font-mono text-xs">{log.templateKey || "—"}</td>
                    <td className="px-4 py-3 truncate max-w-[200px]">{log.subject}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.status === "sent"
                            ? "text-green-600"
                            : log.status === "failed"
                              ? "text-destructive"
                              : "text-muted-foreground"
                        }
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              className="text-sm px-3 py-1 border rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span className="text-sm py-1">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="text-sm px-3 py-1 border rounded disabled:opacity-50"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

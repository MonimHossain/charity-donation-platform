"use client";

import { demoActivityLogs } from "@/lib/mock/activity";
import { fmtDate } from "@/lib/mock/format";

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-2xl md:text-3xl text-primary">Activity logs</h1>
      <p className="text-sm text-muted-foreground">Demo audit trail from mock data.</p>
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Time</th>
              <th className="text-left px-4 py-3 font-semibold">Actor</th>
              <th className="text-left px-4 py-3 font-semibold">Action</th>
              <th className="text-left px-4 py-3 font-semibold">Entity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {demoActivityLogs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(l.time)}</td>
                <td className="px-4 py-3">{l.actor}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-3">
                  {l.entity}
                  {l.meta && <span className="block text-xs text-muted-foreground">{l.meta}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";

interface ExpiringCert {
  id: number;
  certificateId: string;
  charityName: string;
  expiryDate: string;
}

interface Props {
  items: ExpiringCert[];
  loading?: boolean;
}

export function ExpiringCertificationsTable({ items, loading }: Props) {
  return (
    <div className="rounded-2xl border bg-card shadow-soft">
      <div className="p-5 pb-0">
        <h3 className="text-lg font-serif font-bold text-foreground">Expiring Certifications</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Certificates expiring within the next 90 days</p>
      </div>
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">No certifications expiring soon.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Certificate</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Charity</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Expiry Date</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{item.certificateId}</td>
                  <td className="px-5 py-3 text-muted-foreground">{item.charityName}</td>
                  <td className="px-5 py-3 font-medium text-amber-600">{formatDate(item.expiryDate)}</td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/certifications/${item.id}/renew`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Renew
                    </Link>
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

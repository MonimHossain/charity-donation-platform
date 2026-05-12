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
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">Expiring Certifications</h3>
      <p className="text-xs text-muted-foreground">Certificates expiring within the next 90 days.</p>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No certifications expiring soon.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left">Certificate</th>
                <th className="py-2 text-left">Charity</th>
                <th className="py-2 text-left">Expiry Date</th>
                <th className="py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 font-medium text-foreground">{item.certificateId}</td>
                  <td className="py-2 text-muted-foreground">{item.charityName}</td>
                  <td className="py-2 text-amber-600 font-medium">{formatDate(item.expiryDate)}</td>
                  <td className="py-2">
                    <Link href={`/admin/certifications/${item.id}/renew`} className="text-xs text-primary hover:underline">
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

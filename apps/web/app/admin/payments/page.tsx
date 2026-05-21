"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, CreditCard } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ProviderRow {
  id: string;
  enabled: boolean;
  configured: boolean;
  publicKey?: string;
}

export default function AdminPaymentsPage() {
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/payments/status")
      .then((res) => setProviders(res.data.providers || []))
      .catch(() => setProviders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Payment providers</h1>
        <p className="text-muted-foreground mt-1">
          Secrets are set in server environment variables. Enable providers under Settings → Payment.
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-4 font-medium">Provider</th>
              <th className="p-4 font-medium">Env configured</th>
              <th className="p-4 font-medium">Enabled in admin</th>
              <th className="p-4 font-medium">Checkout ready</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="p-4 capitalize font-medium flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  {p.id}
                </td>
                <td className="p-4">
                  {p.configured ? (
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <CheckCircle2 className="h-4 w-4" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-4 w-4" /> Missing env vars
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      p.enabled || p.configured
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {p.enabled ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-4">
                  {p.enabled ? (
                    <span className="text-green-700 font-medium">Active</span>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Per-campaign gateway selection: Campaigns → edit campaign → Gateways tab.
      </p>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchAdminDonationById, fetchDonationReceipt } from "@/lib/api";
import DonationTransactionDetail from "@/components/admin/DonationTransactionDetail";
import DonationReceiptView from "@/components/donation/DonationReceiptView";
import { cn } from "@/lib/utils";

export default function AdminDonationDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const initialTab = searchParams.get("tab") === "receipt" ? "receipt" : "details";
  const [tab, setTab] = useState<"details" | "receipt">(initialTab);
  const [donation, setDonation] = useState<Record<string, unknown> | null>(null);
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAdminDonationById(id),
      fetchDonationReceipt(id).catch(() => null),
    ])
      .then(([detail, receiptData]) => {
        setDonation(detail);
        setReceipt(receiptData);
      })
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!donation) {
    return <p className="text-center text-muted-foreground py-16">Donation not found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif tracking-tight">Transaction details</h1>
        <p className="text-muted-foreground text-sm mt-1 font-mono">{id}</p>
      </div>

      {donation.status === "completed" && receipt && (
        <div className="flex gap-2">
          {(["details", "receipt"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {tab === "receipt" && receipt ? (
        <DonationReceiptView receipt={receipt} />
      ) : (
        <DonationTransactionDetail
          donation={donation as Parameters<typeof DonationTransactionDetail>[0]["donation"]}
          backHref="/admin/donations"
          backLabel="All donations"
          showStripeLink
        />
      )}
    </div>
  );
}

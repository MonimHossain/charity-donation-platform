"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchUserDonationById } from "@/lib/api";
import DonationTransactionDetail from "@/components/admin/DonationTransactionDetail";

export default function UserDonationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [donation, setDonation] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDonationById(id)
      .then(setDonation)
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!donation) {
    return <p className="text-center text-muted-foreground py-16">Donation not found.</p>;
  }

  return (
    <DonationTransactionDetail
      donation={donation as Parameters<typeof DonationTransactionDetail>[0]["donation"]}
      backHref="/account/history"
      backLabel="Donation history"
      showStripeLink={false}
      receiptHref={
        donation.status === "completed" ? `/account/receipt/${id}` : undefined
      }
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { fetchDonationReceipt } from "@/lib/api";
import DonationReceiptView from "@/components/donation/DonationReceiptView";
import { Button } from "@/components/ui/button";

export default function UserReceiptPage() {
  const params = useParams();
  const id = params.id as string;
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDonationReceipt(id)
      .then(setReceipt)
      .catch(() => setError("Receipt not found or not available."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">{error || "Receipt unavailable."}</p>
        <Button variant="outline" asChild className="rounded-full">
          <Link href="/account/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="rounded-full -ml-2">
        <Link href="/account/history">← Back to history</Link>
      </Button>
      <DonationReceiptView receipt={receipt} />
    </div>
  );
}

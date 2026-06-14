"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Repeat,
  Calendar,
  Pause,
  Play,
  XCircle,
  CreditCard,
  Loader2,
  AlertTriangle,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchUserRecurringDonations,
  pauseRecurringDonation,
  resumeRecurringDonation,
  cancelRecurringDonation,
  createRecurringBillingPortal,
} from "@/lib/api";
import { useCurrency } from "@/lib/currency";

interface RecurringDonation {
  id: string;
  amount: number;
  currency: string;
  frequency: string;
  campaign?: string;
  status: "active" | "paused" | "cancelled";
  nextPaymentDate?: string;
  createdAt: string;
}

export default function RecurringDonationsPage() {
  const { formatMoney } = useCurrency();
  const [donations, setDonations] = useState<RecurringDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetchUserRecurringDonations()
      .then((list) => setDonations(Array.isArray(list) ? list : []))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  };

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await pauseRecurringDonation(id);
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "paused" } : d))
      );
    } catch {
      // handle error silently
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    try {
      await resumeRecurringDonation(id);
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "active" } : d))
      );
    } catch {
      // handle error silently
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePayment = async (id: string) => {
    setActionLoading(id);
    try {
      const { url } = await createRecurringBillingPortal(id);
      if (url) window.location.href = url;
    } catch {
      /* user may see provider error */
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await cancelRecurringDonation(id);
      setDonations((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "cancelled" } : d))
      );
    } catch {
      // handle error silently
    } finally {
      setActionLoading(null);
      setCancelConfirm(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "paused":
        return "bg-yellow-100 text-yellow-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl text-primary">
            Recurring Donations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your regular giving commitments.
          </p>
        </div>
        <Button asChild variant="accent" className="rounded-full gap-2">
          <Link href="/donate?freq=monthly">
            <Repeat className="w-4 h-4" /> Set Up New Recurring Gift
          </Link>
        </Button>
      </div>

      {donations.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-12 shadow-soft text-center">
          <Repeat className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <h2 className="font-serif text-xl text-primary mt-4">
            No Recurring Donations
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Set up a regular gift to multiply your impact. Monthly donors help us
            plan ahead and deliver consistent support.
          </p>
          <Button
            asChild
            variant="accent"
            className="mt-6 rounded-full gap-2"
          >
            <Link href="/donate?freq=monthly">
              <Heart className="w-4 h-4" /> Start Monthly Giving
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((don) => (
            <div
              key={don.id}
              className={cn(
                "rounded-3xl bg-card border border-border p-6 shadow-soft transition-all",
                don.status === "cancelled" && "opacity-60"
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Left: Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Repeat className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">
                        {formatMoney(don.amount, { from: don.currency, decimals: 2 })}
                        <span className="text-muted-foreground text-sm font-normal">
                          /{don.frequency}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {don.campaign || "General Fund"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className={cn(
                        "inline-flex px-2.5 py-0.5 rounded-full font-semibold capitalize",
                        statusColor(don.status)
                      )}
                    >
                      {don.status}
                    </span>
                    {don.nextPaymentDate && don.status === "active" && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Next:{" "}
                        {new Date(don.nextPaymentDate).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      Started:{" "}
                      {don.createdAt
                        ? new Date(don.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                {don.status !== "cancelled" && (
                  <div className="flex flex-wrap gap-2">
                    {don.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5"
                        disabled={actionLoading === don.id}
                        onClick={() => handlePause(don.id)}
                      >
                        {actionLoading === don.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Pause className="w-3.5 h-3.5" />
                        )}
                        Pause
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5"
                        disabled={actionLoading === don.id}
                        onClick={() => handleResume(don.id)}
                      >
                        {actionLoading === don.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        Resume
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-1.5"
                      disabled={actionLoading === don.id}
                      onClick={() => handleUpdatePayment(don.id)}
                    >
                      {actionLoading === don.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5" />
                      )}
                      Update Payment
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setCancelConfirm(don.id)}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Cancel confirmation */}
              {cancelConfirm === don.id && (
                <div className="mt-4 p-4 rounded-2xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-destructive">
                        Cancel this recurring donation?
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This action will stop all future payments. You can always
                        set up a new recurring donation later.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-xl"
                          disabled={actionLoading === don.id}
                          onClick={() => handleCancel(don.id)}
                        >
                          {actionLoading === don.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            "Yes, Cancel"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => setCancelConfirm(null)}
                        >
                          Keep Donating
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

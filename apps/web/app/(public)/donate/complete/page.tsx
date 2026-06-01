"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDonationStatus } from "@/lib/api";
import { trackEvent } from "@/components/analytics/GTMScript";

function CompleteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const donationId = params.get("donationId") || "";
  const provider = params.get("provider") || "";

  const [status, setStatus] = useState<"loading" | "completed" | "pending" | "failed">("loading");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!donationId) {
      setStatus("failed");
      return;
    }

    let cancelled = false;

    async function poll() {
      try {
        const data = await getDonationStatus(donationId);
        if (cancelled) return;
        if (data.status === "completed") {
          setStatus("completed");
          trackEvent("donation_complete", {
            donation_id: donationId,
            provider,
            value: data.totalAmount,
            currency: data.currency || "GBP",
          });
          const summaryParams = new URLSearchParams({
            donationId,
            provider,
          });
          if (data.totalAmount != null) {
            summaryParams.set("amount", String(data.totalAmount));
          }
          if (data.currency) summaryParams.set("currency", data.currency);
          if (data.receiptNumber) summaryParams.set("receiptNumber", data.receiptNumber);
          router.replace(`/thank-you?${summaryParams.toString()}`);
          return;
        }
        if (data.status === "failed") {
          setStatus("failed");
          return;
        }
        setStatus("pending");
        if (attempts < 15) {
          setTimeout(() => setAttempts((a) => a + 1), 2000);
        }
      } catch {
        if (!cancelled) setStatus("failed");
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [donationId, attempts, provider, router]);

  if (status === "loading" || status === "pending") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-center">
          Confirming your payment… This may take a few moments.
        </p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <h1 className="text-xl font-serif font-bold">Payment not confirmed</h1>
        <p className="text-muted-foreground text-center max-w-md">
          We could not verify your payment. If you were charged, contact support with your receipt.
        </p>
        <Button asChild>
          <Link href="/donate">Try again</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <CheckCircle2 className="h-12 w-12 text-primary" />
      <p>Redirecting…</p>
    </div>
  );
}

export default function DonateCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { verifyPublicCertificationById } from "@/lib/api";
import { CertificationStatusBadge } from "@/components/common/CharityStatusBadge";
import { formatDate } from "@/lib/format";
import { ShieldCheck, ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyCertificatePage() {
  const params = useParams();
  const certificateId = params.certificateId as string;
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    verifyPublicCertificationById(certificateId)
      .then((res: any) => setResult(res.data || res))
      .catch((err: any) => setError(err.message || "Verification failed"))
      .finally(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldX className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground">Verification Failed</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Link href="/verify">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="h-4 w-4 mr-2" /> Try Another
          </Button>
        </Link>
      </div>
    );
  }

  const isValid = result?.isCurrentlyValid;

  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isValid ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {isValid ? <ShieldCheck className="h-8 w-8" /> : <ShieldX className="h-8 w-8" />}
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold text-foreground">
            {isValid ? "Certificate Verified" : "Certificate Not Valid"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            Certificate ID: <code className="font-mono font-semibold">{certificateId}</code>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-lg px-6 py-10">
        {result && (
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              {result.certification && (
                <CertificationStatusBadge status={result.certification.status} />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Charity</span>
              <Link href={`/charities/${result.charity?.slug}`} className="text-sm font-medium text-primary hover:underline">
                {result.charity?.name}
              </Link>
            </div>
            {result.charity?.country && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Country</span>
                <span className="text-sm font-medium">{result.charity.country}</span>
              </div>
            )}
            {result.certification?.issueDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Issue Date</span>
                <span className="text-sm font-medium">{formatDate(result.certification.issueDate)}</span>
              </div>
            )}
            {result.certification?.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expiry Date</span>
                <span className="text-sm font-medium">{formatDate(result.certification.expiryDate)}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/verify">
            <Button variant="outline">Verify Another</Button>
          </Link>
          {result?.charity?.slug && (
            <Link href={`/charities/${result.charity.slug}`}>
              <Button>View Charity Profile</Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

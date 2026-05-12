"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export default function VerifyPage() {
  const router = useRouter();
  const [certificateId, setCertificateId] = useState("");

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certificateId.trim()) {
      router.push(`/verify/${encodeURIComponent(certificateId.trim())}`);
    }
  };

  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-bold text-foreground">
            Verify a Certification
          </h1>
          <p className="mt-3 max-w-lg mx-auto text-muted-foreground">
            Enter a certificate ID below to verify its authenticity and check the
            current certification status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-md px-6 py-12">
        <form onSubmit={handleVerify} className="space-y-4 rounded-2xl border bg-card p-8 shadow-sm">
          <div className="space-y-2">
            <Label>Certificate ID</Label>
            <Input
              placeholder="e.g., CERT-2025-001"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" size="lg">
            Verify Certificate
          </Button>
        </form>
      </section>
    </div>
  );
}

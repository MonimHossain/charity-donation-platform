"use client";

import { createAdminCertification } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewCertificationPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    charityId: "",
    certificateId: "",
    issueDate: "",
    expiryDate: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createAdminCertification({
        charityId: Number(form.charityId),
        certificateId: form.certificateId,
        issueDate: form.issueDate,
        expiryDate: form.expiryDate,
      });
      toast.success("Certification created successfully.");
      router.push("/admin/certifications");
    } catch {
      toast.error("Failed to create certification.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Issue Certification</h1>
        <p className="text-sm text-muted-foreground">Create a certification record and link it to a charity.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Certification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Charity ID</Label>
                <Input value={form.charityId} onChange={(e) => setForm((p) => ({ ...p, charityId: e.target.value }))} type="number" required />
              </div>
              <div className="space-y-2">
                <Label>Certificate ID</Label>
                <Input value={form.certificateId} onChange={(e) => setForm((p) => ({ ...p, certificateId: e.target.value }))} placeholder="CERT-2025-001" required />
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input value={form.issueDate} onChange={(e) => setForm((p) => ({ ...p, issueDate: e.target.value }))} type="date" required />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input value={form.expiryDate} onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))} type="date" required />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Creating..." : "Create Certification"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/certifications")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

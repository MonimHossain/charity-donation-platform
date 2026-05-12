"use client";

import { fetchAdminCharityById, updateAdminCharity } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function EditCharityPage() {
  const params = useParams();
  const router = useRouter();
  const charityId = Number(Array.isArray(params?.id) ? params.id[0] : params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    country: "",
    shortDescription: "",
    websiteUrl: "",
    auditSummary: "",
  });

  useEffect(() => {
    if (!charityId || Number.isNaN(charityId)) {
      setError("Invalid charity ID.");
      setLoading(false);
      return;
    }
    fetchAdminCharityById(charityId)
      .then((data: any) => {
        setForm({
          name: data.name ?? "",
          slug: data.slug ?? "",
          country: data.country ?? "",
          shortDescription: data.shortDescription ?? "",
          websiteUrl: data.websiteUrl ?? "",
          auditSummary: data.auditSummary ?? "",
        });
      })
      .catch((err: any) => setError(err?.message || "Failed to load charity"))
      .finally(() => setLoading(false));
  }, [charityId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateAdminCharity(charityId, form);
      toast.success("Charity updated successfully.");
      router.push("/admin/charities");
    } catch {
      toast.error("Failed to update charity.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading charity profile...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-foreground">Edit Charity</h1>
        <p className="text-sm text-muted-foreground">Review and update the charity profile.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Charity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Website URL</Label>
                <Input value={form.websiteUrl} onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))} type="url" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Short Description</Label>
              <Textarea value={form.shortDescription} onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Audit Summary</Label>
              <Textarea value={form.auditSummary} onChange={(e) => setForm((p) => ({ ...p, auditSummary: e.target.value }))} rows={5} />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              <Button type="button" variant="outline" onClick={() => router.push("/admin/charities")}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

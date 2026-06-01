"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDonationPage, upsertDonationPage } from "@/lib/stores/donationPageStore";
import { useDonationPageAdmin, useDonationPageMutations } from "@/lib/data/donation-pages";
import { USE_MOCK_DATA } from "@/lib/config";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AdminDonationPageEditPage() {
  const params = useParams<{ id: string }>();
  const storePage = useDonationPage(params.id);
  const { data: apiPage, isLoading } = useDonationPageAdmin(params.id);
  const { update } = useDonationPageMutations();
  const page = USE_MOCK_DATA ? storePage : apiPage;
  const [saving, setSaving] = useState(false);

  if (isLoading && !USE_MOCK_DATA) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    return <p className="text-muted-foreground">Page not found.</p>;
  }

  const saveField = async (field: "title" | "shortDescription" | "slug", value: string) => {
    if (USE_MOCK_DATA) {
      upsertDonationPage({ ...page, [field]: value, updatedAt: new Date().toISOString() });
      return;
    }
    setSaving(true);
    try {
      await update.mutateAsync({ id: params.id, payload: { [field]: value } });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/donation-pages">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </Button>
      <h1 className="font-serif text-2xl text-primary">Edit donation page</h1>
      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <Label>Title</Label>
          <Input
            className="mt-1"
            defaultValue={page.title}
            onBlur={(e) => saveField("title", e.target.value)}
          />
        </div>
        <div>
          <Label>Slug</Label>
          <Input
            className="mt-1"
            defaultValue={page.slug}
            onBlur={(e) => saveField("slug", e.target.value)}
          />
        </div>
        <div>
          <Label>Short description</Label>
          <Textarea
            className="mt-1"
            defaultValue={page.shortDescription ?? ""}
            onBlur={(e) => saveField("shortDescription", e.target.value)}
          />
        </div>
        <Button
          className="rounded-full bg-accent hover:bg-accent/90"
          disabled={saving}
          onClick={() => toast.success(USE_MOCK_DATA ? "Saved (demo)" : "All changes saved on blur")}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

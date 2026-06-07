"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FilePicker } from "@/components/ui/file-picker";
import { createAdminDonationPage } from "@/lib/api";
import type { DonationExperience } from "@icac/shared-types";

function slugify(s: string): string {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const EXPERIENCE_OPTIONS: Array<{ id: DonationExperience["type"]; label: string }> = [
  { id: "standard", label: "Standard" },
  { id: "fidya_kaffarah", label: "Fidya / Kaffarah" },
  { id: "ramadan_split", label: "Ramadan split" },
];

export default function AdminDonationPageCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("standard");
  const [shortDescription, setShortDescription] = useState("");
  const [image, setImage] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "archived">("draft");
  const [experienceType, setExperienceType] = useState<DonationExperience["type"]>("standard");
  const [ramadanStartDate, setRamadanStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const computedSlug = useMemo(() => slug || slugify(title), [slug, title]);

  const experience: DonationExperience = useMemo(() => {
    if (experienceType === "fidya_kaffarah") {
      return {
        type: "fidya_kaffarah",
        options: [
          { key: "fidya", label: "Fidya", unitPrice: 5 },
          { key: "kaffarah", label: "Kaffarah", unitPrice: 300 },
        ],
        quantity: { min: 1, max: 999, default: 1, label: "Quantity:" },
        ctaBehavior: "checkout_now",
      };
    }
    if (experienceType === "ramadan_split") {
      return {
        type: "ramadan_split",
        ramadanStartDate,
        maxNights: 30,
      };
    }
    return { type: "standard" };
  }, [experienceType, ramadanStartDate]);

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const page = await createAdminDonationPage({
        title: title.trim(),
        slug: computedSlug || undefined,
        category,
        shortDescription,
        image: image || undefined,
        status,
        config: {
          experience,
          visibility: { homepageFeatured: false, headerFeatured: false, priority: 0 },
        },
      });
      toast.success("Page created");
      router.push(`/admin/donation-pages/${page.id}/edit`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to create page");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" asChild className="-ml-2">
        <Link href="/admin/campaigns">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </Button>

      <div>
        <h1 className="font-serif text-2xl text-primary">Create donation page</h1>
        <p className="text-sm text-muted-foreground mt-1">
          This page won’t be saved until you click Save.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-card p-6">
        <div>
          <Label>Title *</Label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <Label>Slug</Label>
          <Input
            className="mt-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={computedSlug || "auto-generated-from-title"}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="standard">Standard donation</option>
              <option value="fidya">Fidya</option>
              <option value="kaffarah">Kaffarah</option>
              <option value="ramadan">Ramadan</option>
              <option value="general">General</option>
            </select>
          </div>
          <div>
            <Label>Status</Label>
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Short description</Label>
          <Textarea className="mt-1" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
        </div>

        <div>
          <Label>Image (optional)</Label>
          <div className="mt-1">
            <FilePicker value={image} onChange={setImage} accept="image" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            If empty, the homepage will show a default image.
          </p>
        </div>

        <div>
          <Label>Experience type</Label>
          <select
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={experienceType}
            onChange={(e) => setExperienceType(e.target.value as any)}
          >
            {EXPERIENCE_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">
            Fidya/Kaffarah options can be configured after creation.
          </p>
        </div>

        {experienceType === "ramadan_split" && (
          <div>
            <Label>Ramadan start date</Label>
            <Input
              type="date"
              className="mt-1"
              value={ramadanStartDate}
              onChange={(e) => setRamadanStartDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Donors choose nights and weights on the public page (up to 30 days from this date).
            </p>
          </div>
        )}

        <Button
          className="rounded-full bg-accent hover:bg-accent/90"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save"}
        </Button>
      </div>
    </div>
  );
}


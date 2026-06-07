"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import PageShell, { PageHero } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { fetchAdminDonationPageById } from "@/lib/api";
import type { DonationExperience, DonationPageDto } from "@icac/shared-types";

export default function AdminDonationPagePreview() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const [page, setPage] = useState<DonationPageDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchAdminDonationPageById(id)
      .then((data) => setPage(data as DonationPageDto))
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [id]);

  const experience = useMemo(() => {
    return (page?.config?.experience as DonationExperience | undefined) ?? undefined;
  }, [page]);

  if (loading) {
    return (
      <div className="container-wide py-24 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page || !experience) {
    return (
      <PageShell title="Preview" description="Donation page preview not available.">
        <section className="container-wide py-20">
          <PageHero
            eyebrow="Preview"
            title="Preview unavailable"
            description="This page may not exist or has no configured experience."
          />
          <Button asChild className="rounded-full mt-8">
            <Link href="/admin/campaigns">Back</Link>
          </Button>
        </section>
      </PageShell>
    );
  }

  // For now: reuse the public preview experience by linking to public slug when published,
  // but for drafts we still display a meaningful page-level preview shell.
  const publicSlugUrl = `/campaigns/${page.slug}`;

  return (
    <PageShell title={`Preview — ${page.title}`} description={page.shortDescription ?? ""}>
      <section className="container-wide py-16 sm:py-20">
        <PageHero
          eyebrow={`Preview · ${page.status}`}
          title={page.title}
          description={page.shortDescription ?? ""}
        />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link href={`/admin/donation-pages/${page.id}/edit`}>Back to edit</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link href={publicSlugUrl} target="_blank" rel="noreferrer">
              Open public URL
            </Link>
          </Button>
        </div>

        <div className="mt-10 rounded-2xl border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-accent-deep font-bold">Experience type</p>
          <p className="mt-2 text-lg font-semibold">{experience.type}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            This preview is admin-only and works even while the page is a draft.
          </p>
        </div>
      </section>
    </PageShell>
  );
}


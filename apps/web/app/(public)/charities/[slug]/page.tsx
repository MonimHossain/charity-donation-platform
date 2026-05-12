"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchCharityBySlug } from "@/lib/api";
import { AuditStatusBadge, CertificationStatusBadge } from "@/components/common/CharityStatusBadge";
import RiskLevelBadge from "@/components/public/RiskLevelBadge";
import { formatDate } from "@/lib/format";
import { ArrowLeft, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CharityProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [charity, setCharity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharityBySlug(slug)
      .then((res: any) => setCharity(res.data || res))
      .catch((err: any) => setError(err.message || "Failed to load charity"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Charity Not Found</h1>
        <p className="mt-2 text-muted-foreground">{error || "This charity profile does not exist."}</p>
        <Link href="/charities" className="mt-6 inline-block text-primary hover:underline">
          &larr; Back to directory
        </Link>
      </div>
    );
  }

  const scoreBreakdown = charity.scoreBreakdown;

  return (
    <div className="bg-background">
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link href="/charities" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to directory
          </Link>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {charity.country && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                    {charity.country}
                  </span>
                )}
                <AuditStatusBadge status={charity.auditStatus} />
                {charity.certification && (
                  <CertificationStatusBadge status={charity.certification.status} />
                )}
                <RiskLevelBadge riskLevel={charity.riskLevel} />
              </div>
              <h1 className="mt-4 font-serif text-3xl font-bold text-foreground md:text-4xl">
                {charity.name}
              </h1>
              {charity.shortDescription && (
                <p className="mt-3 max-w-2xl text-muted-foreground">{charity.shortDescription}</p>
              )}
            </div>

            {charity.logoUrl && (
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={charity.logoUrl} alt={`${charity.name} logo`} className="h-20 w-20 rounded-xl object-contain" />
              </div>
            )}
          </div>

          {charity.websiteUrl && (
            <a href={charity.websiteUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline">
              <ExternalLink className="h-4 w-4" />
              {charity.websiteUrl}
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {charity.auditSummary && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">Audit Summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{charity.auditSummary}</p>
              </div>
            )}

            {charity.detailedFindings && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">Detailed Findings</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{charity.detailedFindings}</p>
              </div>
            )}

            {(charity.keyStrengths?.length > 0 || charity.improvementAreas?.length > 0) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {charity.keyStrengths?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Key Strengths</h3>
                    <ul className="mt-3 space-y-2">
                      {charity.keyStrengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {charity.improvementAreas?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-700">Areas for Improvement</h3>
                    <ul className="mt-3 space-y-2">
                      {charity.improvementAreas.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {charity.reports?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground">Reports & Documents</h2>
                <div className="mt-3 space-y-2">
                  {charity.reports.map((report: any) => (
                    <a
                      key={report.id}
                      href={report.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg border bg-card p-3 text-sm transition hover:bg-muted/50"
                    >
                      <Download className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{report.title}</p>
                        <p className="text-xs text-muted-foreground">{report.fileTypeLabel} &middot; {formatDate(report.reportDate || report.createdAt)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {charity.overallScore != null && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Overall Score</h3>
                <p className="mt-2 text-4xl font-bold text-primary">{charity.overallScore}<span className="text-lg text-muted-foreground">/100</span></p>
              </div>
            )}

            {scoreBreakdown && (
              <div className="rounded-xl border bg-card p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Score Breakdown</h3>
                {Object.entries(scoreBreakdown).map(([key, value]) => {
                  if (value == null) return null;
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                  return (
                    <div key={key} className="mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium">{value as number}/100</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${value as number}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-xl border bg-card p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Key Dates</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Audit Date</dt>
                  <dd className="font-medium">{formatDate(charity.auditDate)}</dd>
                </div>
                {charity.certification && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Issued</dt>
                      <dd className="font-medium">{formatDate(charity.certification.issueDate)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Expires</dt>
                      <dd className="font-medium">{formatDate(charity.certification.expiryDate)}</dd>
                    </div>
                  </>
                )}
              </dl>
            </div>

            {charity.certification?.certificateId && (
              <div className="rounded-xl border bg-card p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certificate ID</p>
                <p className="mt-2 text-lg font-mono font-semibold text-foreground">{charity.certification.certificateId}</p>
                <Link href={`/verify/${charity.certification.certificateId}`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    Verify Certificate
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

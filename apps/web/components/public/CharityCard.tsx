import Link from 'next/link';
import { AuditStatusBadge, CertificationStatusBadge } from '@/components/common/CharityStatusBadge';
import type { AuditStatus, CertificationStatus } from '@/lib/shared-types';

export type CharityCardData = {
  name: string;
  slug: string;
  country?: string | null;
  logoUrl?: string | null;
  auditStatus: AuditStatus;
  auditDate?: string | null;
  certification?: {
    status: CertificationStatus;
    certificateId: string;
    issueDate?: string | null;
    expiryDate?: string | null;
  } | null;
};

export default function CharityCard({ charity }: { charity: CharityCardData }) {
  const logoUrl = charity.logoUrl?.trim();

  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex h-full flex-col justify-between p-6">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary">
                {charity.country || 'Global'}
              </span>
              <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {charity.name}
              </h3>
            </div>

            {logoUrl && (
              <div className="hidden shrink-0 md:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={`${charity.name} logo`} className="h-16 w-16 object-contain rounded-lg" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Audit</span>
              <AuditStatusBadge status={charity.auditStatus} />
            </div>
            {charity.certification && (
              <div className="flex flex-col items-start gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Certification</span>
                <CertificationStatusBadge status={charity.certification.status} />
              </div>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Audit Date</dt>
              <dd className="mt-1 font-medium text-foreground">{charity.auditDate ?? 'Pending'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Expiry</dt>
              <dd className="mt-1 font-medium text-foreground">{charity.certification?.expiryDate ?? 'Not Issued'}</dd>
            </div>
          </dl>

          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {charity.certification?.certificateId ?? 'No Certificate'}
          </p>
        </div>

        <div className="mt-6">
          <Link
            href={`/charities/${charity.slug}`}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-primary transition hover:bg-primary/10"
          >
            <span>View Profile</span>
            <span className="text-lg leading-none transition group-hover:translate-x-0.5">&rsaquo;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

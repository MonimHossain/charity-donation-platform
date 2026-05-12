import {
  AUDIT_STATUS_BADGE_STYLES,
  AUDIT_STATUS_LABELS,
  CERTIFICATION_STATUS_BADGE_STYLES,
  CERTIFICATION_STATUS_LABELS,
} from '@/lib/charity-status';
import { cn } from '@/lib/utils';
import type { AuditStatus, CertificationStatus } from '@/lib/shared-types';

const baseClassName =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]';

export function AuditStatusBadge({ status, className }: { status: AuditStatus; className?: string }) {
  return (
    <span className={cn(baseClassName, AUDIT_STATUS_BADGE_STYLES[status], className)}>
      {AUDIT_STATUS_LABELS[status]}
    </span>
  );
}

export function CertificationStatusBadge({ status, className }: { status: CertificationStatus; className?: string }) {
  return (
    <span className={cn(baseClassName, CERTIFICATION_STATUS_BADGE_STYLES[status], className)}>
      {CERTIFICATION_STATUS_LABELS[status]}
    </span>
  );
}

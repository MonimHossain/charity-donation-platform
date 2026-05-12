import { DASHBOARD_SUBMISSION_STATUS_LABELS, DASHBOARD_SUBMISSION_STATUS_STYLES } from '@/lib/dashboard-status';
import { cn } from '@/lib/utils';
import type { SubmissionStatus } from '@/lib/shared-types';

const baseClassName =
  'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]';

export function SubmissionStatusBadge({ status, className }: { status: SubmissionStatus; className?: string }) {
  return (
    <span className={cn(baseClassName, DASHBOARD_SUBMISSION_STATUS_STYLES[status], className)}>
      {DASHBOARD_SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}

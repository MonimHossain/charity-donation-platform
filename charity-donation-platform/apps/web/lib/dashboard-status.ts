import { SubmissionStatus } from './shared-types';

export const DASHBOARD_SUBMISSION_TYPE_LABELS: Record<'APPLICATION' | 'CONCERN' | 'CONTACT', string> = {
  APPLICATION: 'Application',
  CONCERN: 'Concern',
  CONTACT: 'Contact',
};

export const DASHBOARD_SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  NEW: 'New',
  REVIEWING: 'Reviewing',
  CONTACTED: 'Contacted',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REVIEWED: 'Reviewing',
};

export const DASHBOARD_SUBMISSION_STATUS_STYLES: Record<SubmissionStatus, string> = {
  NEW: 'bg-primary/80 text-white',
  REVIEWING: 'bg-emerald-700 text-white',
  CONTACTED: 'bg-amber-700 text-white',
  RESOLVED: 'bg-teal-600 text-white',
  CLOSED: 'bg-gray-500 text-white',
  REVIEWED: 'bg-emerald-700 text-white',
};

export const SUBMISSION_STATUS_OPTIONS = [
  SubmissionStatus.NEW,
  SubmissionStatus.REVIEWING,
  SubmissionStatus.CONTACTED,
  SubmissionStatus.RESOLVED,
  SubmissionStatus.CLOSED,
].map((status) => ({
  value: status,
  label: DASHBOARD_SUBMISSION_STATUS_LABELS[status],
}));

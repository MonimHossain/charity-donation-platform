import {
  AuditStatus,
  AuditWorkflowStage,
  CertificationStatus,
} from './shared-types';

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  [AuditStatus.PASSED]: 'Passed',
  [AuditStatus.FAILED]: 'Failed',
  [AuditStatus.REJECTED_REQUEST]: 'Rejected Our Request',
  [AuditStatus.UNDER_REVIEW]: 'Under Review',
  [AuditStatus.EXPIRED]: 'Expired',
};

export const CERTIFICATION_STATUS_LABELS: Record<CertificationStatus, string> = {
  [CertificationStatus.VALID]: 'Valid',
  [CertificationStatus.EXPIRED]: 'Expired',
  [CertificationStatus.INVALID]: 'Invalid',
  [CertificationStatus.NOT_CERTIFIED]: 'Not Certified',
};

export const AUDIT_STATUS_BADGE_STYLES: Record<AuditStatus, string> = {
  [AuditStatus.PASSED]: 'bg-emerald-700 text-white',
  [AuditStatus.FAILED]: 'bg-red-700 text-white',
  [AuditStatus.REJECTED_REQUEST]: 'bg-gray-600 text-white',
  [AuditStatus.UNDER_REVIEW]: 'bg-primary/80 text-white',
  [AuditStatus.EXPIRED]: 'bg-amber-700 text-white',
};

export const CERTIFICATION_STATUS_BADGE_STYLES: Record<CertificationStatus, string> = {
  [CertificationStatus.VALID]: 'bg-emerald-700 text-white',
  [CertificationStatus.EXPIRED]: 'bg-amber-700 text-white',
  [CertificationStatus.INVALID]: 'bg-red-700 text-white',
  [CertificationStatus.NOT_CERTIFIED]: 'bg-gray-500 text-white',
};

export const AUDIT_STATUS_OPTIONS = Object.values(AuditStatus).map((value) => ({
  value,
  label: AUDIT_STATUS_LABELS[value],
}));

export const AUDIT_STAGE_LABELS: Record<AuditWorkflowStage, string> = {
  [AuditWorkflowStage.APPLICATION_INTAKE]: 'Application Intake',
  [AuditWorkflowStage.EVIDENCE_REVIEW]: 'Evidence Review',
  [AuditWorkflowStage.FIELD_ASSESSMENT]: 'Field / Operational Assessment',
  [AuditWorkflowStage.PANEL_DECISION]: 'Certification Panel',
  [AuditWorkflowStage.PUBLICATION_VERIFICATION]: 'Publication & Verification',
  [AuditWorkflowStage.ANNUAL_RENEWAL]: 'Annual Renewal',
};

export const AUDIT_STAGE_OPTIONS = [
  AuditWorkflowStage.APPLICATION_INTAKE,
  AuditWorkflowStage.EVIDENCE_REVIEW,
  AuditWorkflowStage.FIELD_ASSESSMENT,
  AuditWorkflowStage.PANEL_DECISION,
  AuditWorkflowStage.PUBLICATION_VERIFICATION,
  AuditWorkflowStage.ANNUAL_RENEWAL,
].map((value) => ({
  value,
  label: AUDIT_STAGE_LABELS[value],
}));

export const CERTIFICATION_STATUS_OPTIONS = Object.values(CertificationStatus).map((value) => ({
  value,
  label: CERTIFICATION_STATUS_LABELS[value],
}));

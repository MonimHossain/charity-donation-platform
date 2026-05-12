import { type AuditStatus, type CertificationStatus } from './shared-types';

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PublicCertificationSummary = {
  certificateId: string;
  status: CertificationStatus;
  issueDate: string;
  expiryDate: string;
  certificationYear: number;
  badgeEnabled: boolean;
  badgeActive: boolean;
  badgeImageUrl?: string | null;
  isCurrent: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  invalidReason?: string | null;
};

export type PublicReportSummary = {
  id: number;
  title: string;
  description?: string | null;
  reportDate?: string | null;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  fileTypeLabel: string;
  createdAt: string;
  downloadUrl: string;
};

export type PublicExpertSummary = {
  id: number;
  name: string;
  title: string | null;
  role: string;
  qualification: string | null;
  expertise: string | null;
  country: string | null;
  bio: string | null;
  photoUrl: string | null;
  isIllustrativeExample: boolean;
};

export type PublicCharityListItem = {
  id: number;
  name: string;
  slug: string;
  country?: string | null;
  logoUrl?: string | null;
  auditStatus: AuditStatus;
  auditDate?: string | null;
  isFeatured: boolean;
  certification?: PublicCertificationSummary | null;
};

export type PublicCharityDetail = {
  id: number;
  name: string;
  slug: string;
  country?: string | null;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  shortDescription?: string | null;
  auditStatus: AuditStatus;
  auditSummary?: string | null;
  detailedFindings?: string | null;
  auditDate?: string | null;
  overallScore?: number | null;
  riskLevel?: string | null;
  scoreBreakdown?: {
    financialTransparency: number | null;
    governance: number | null;
    programImpact: number | null;
    ethicalFundraising: number | null;
    zakatCompliance: number | null;
  } | null;
  keyStrengths: string[];
  improvementAreas: string[];
  auditExperts: PublicExpertSummary[];
  certification?: PublicCertificationSummary | null;
  certificationHistory: PublicCertificationSummary[];
  reports: PublicReportSummary[];
};

export type PublicVerificationResult = {
  status: CertificationStatus;
  verificationState: CertificationStatus;
  isCurrentlyValid: boolean;
  charity: {
    id: number;
    name: string;
    slug: string;
    country?: string | null;
    websiteUrl?: string | null;
    auditStatus: AuditStatus;
    auditDate?: string | null;
  };
  certification?: PublicCertificationSummary | null;
};

export type PublicStats = {
  charitiesReviewed: number;
  countriesCovered: number;
  validCertifications: number;
  certificationsIssued: number;
  ongoingReviews: number;
};

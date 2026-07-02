export type DonorSegmentType =
  | "campaign"
  | "recurring"
  | "loyal"
  | "at_risk"
  | "expiring_soon"
  | "recent";

export type DonorSegmentParams = {
  segment: DonorSegmentType;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
};

export const DONOR_SEGMENT_LABELS: Record<DonorSegmentType, string> = {
  campaign: "By campaign",
  recurring: "Recurring donors",
  loyal: "Loyal supporters",
  at_risk: "At-risk subscriptions",
  expiring_soon: "Expiring soon",
  recent: "By donation date",
};

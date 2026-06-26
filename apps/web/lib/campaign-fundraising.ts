type CampaignFundraisingSource = {
  raisedAmount?: number;
  goalAmount?: number;
  raised?: number;
  goal?: number;
  endDate?: string;
  fundraiserSettings?: {
    raisedAmount?: number;
    targetAmount?: number;
    endDate?: string;
  };
};

function toSafeAmount(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function getCampaignRaisedAmount(campaign: CampaignFundraisingSource): number {
  return toSafeAmount(
    campaign.raisedAmount ??
      campaign.raised ??
      campaign.fundraiserSettings?.raisedAmount ??
      0
  );
}

export function getCampaignGoalAmount(campaign: CampaignFundraisingSource): number {
  return toSafeAmount(
    campaign.goalAmount ??
      campaign.goal ??
      campaign.fundraiserSettings?.targetAmount ??
      0
  );
}

export function getCampaignEndDate(campaign: CampaignFundraisingSource): string | undefined {
  const end = campaign.endDate ?? campaign.fundraiserSettings?.endDate;
  return end?.trim() ? end : undefined;
}

export function getCampaignFundraisingProgress(campaign: CampaignFundraisingSource): number {
  const raised = getCampaignRaisedAmount(campaign);
  const goal = getCampaignGoalAmount(campaign);
  if (goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

type CampaignDonorDisplaySource = {
  donorCount?: number;
  donors?: number;
  displayDonorOffset?: number;
};

/** Public-facing donor count: cosmetic offset + real completed donations. */
export function getDisplayDonorCount(campaign: CampaignDonorDisplaySource): number {
  const offset = Math.max(0, Number(campaign.displayDonorOffset ?? 0) || 0);
  const real = Math.max(0, Number(campaign.donorCount ?? campaign.donors ?? 0) || 0);
  return offset + real;
}

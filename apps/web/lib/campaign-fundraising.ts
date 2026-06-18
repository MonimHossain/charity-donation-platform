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

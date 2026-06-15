import { In } from "typeorm";
import { AppDataSource } from "../../helper/connectDB.js";
import { Upsell } from "../../components/upsell/upsell.entity.js";
import type { Campaign } from "../../components/campaign/campaign.entity.js";
import { normalizeOptionalMediaUrl } from "../../helper/storage.js";

export interface ResolvedCampaignUpsell {
  id: string;
  name: string;
  description: string;
  image?: string;
  amount: number;
  sortOrder: number;
  isActive: boolean;
}

const upsellRepo = () => AppDataSource.getRepository(Upsell);

function campaignUpsellIds(campaign: Campaign): string[] {
  if (Array.isArray(campaign.upsellIds) && campaign.upsellIds.length > 0) {
    return campaign.upsellIds.filter(Boolean);
  }
  if (Array.isArray(campaign.upsells) && campaign.upsells.length > 0) {
    return campaign.upsells.map((u) => u.id).filter(Boolean);
  }
  return [];
}

export async function resolveCampaignUpsells(campaign: Campaign): Promise<ResolvedCampaignUpsell[]> {
  const ids = campaignUpsellIds(campaign);
  if (!ids.length) return [];

  const rows = await upsellRepo().find({
    where: { id: In(ids), isActive: true },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  return ids
    .map((id, index) => {
      const row = byId.get(id);
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        image: normalizeOptionalMediaUrl(row.image),
        amount: Number(row.amount ?? 0),
        sortOrder: row.sortOrder ?? index,
        isActive: row.isActive,
      };
    })
    .filter((row) => row != null) as ResolvedCampaignUpsell[];
}

export async function withResolvedUpsells<T extends Campaign>(
  campaign: T
): Promise<T & { upsells: ResolvedCampaignUpsell[] }> {
  const upsells = await resolveCampaignUpsells(campaign);
  return { ...campaign, upsells };
}

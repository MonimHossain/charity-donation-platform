import type { Repository } from "typeorm";
import { Campaign } from "../../components/campaign/campaign.entity.js";

export async function archiveExpiredCampaigns(
  repository: Repository<Campaign>
): Promise<number> {
  const now = new Date();

  const result = await repository
    .createQueryBuilder()
    .update(Campaign)
    .set({ status: "archived" })
    .where("status = :status", { status: "published" })
    .andWhere("expirationEnabled = :enabled", { enabled: true })
    .andWhere("expiresAt IS NOT NULL")
    .andWhere("expiresAt <= :now", { now: now.toISOString() })
    .execute();

  return result.affected ?? 0;
}

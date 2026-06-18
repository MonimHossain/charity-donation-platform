import { AppDataSource } from "../../helper/connectDB.js";
import { Campaign } from "../../components/campaign/campaign.entity.js";

const campaignRepo = () => AppDataSource.getRepository(Campaign);

/** Resolve a campaign UUID from id and/or slug (slug used when id is missing). */
export async function resolveCampaignId(
  campaignId?: string | null,
  campaignSlug?: string | null
): Promise<string | undefined> {
  const id = typeof campaignId === "string" ? campaignId.trim() : "";
  if (id) {
    const byId = await campaignRepo().findOne({ where: { id }, select: ["id"] });
    if (byId) return byId.id;
  }

  const slug = typeof campaignSlug === "string" ? campaignSlug.trim() : "";
  if (slug) {
    const bySlug = await campaignRepo().findOne({ where: { slug }, select: ["id"] });
    if (bySlug) return bySlug.id;
  }

  return undefined;
}

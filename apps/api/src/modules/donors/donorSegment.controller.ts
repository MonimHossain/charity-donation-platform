import { Request, Response } from "express";
import {
  countSegmentDonors,
  getAllSegmentUserIds,
  getSegmentUsers,
  isDonorSegmentType,
  parseSegmentParams,
} from "./donorSegment.service.js";

export async function getDonorSegmentCount(req: Request, res: Response) {
  try {
    const params = parseSegmentParams(req.query as Record<string, unknown>);
    if (!params) {
      return res.status(400).json({ message: "Valid segment query parameter is required" });
    }
    if (params.segment === "campaign" && !params.campaignId) {
      return res.status(400).json({ message: "campaignId is required for campaign segment" });
    }

    const counts = await countSegmentDonors(params);
    return res.json(counts);
  } catch (error) {
    console.error("getDonorSegmentCount error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonorSegmentUsers(req: Request, res: Response) {
  try {
    const params = parseSegmentParams(req.query as Record<string, unknown>);
    if (!params) {
      return res.status(400).json({ message: "Valid segment query parameter is required" });
    }
    if (params.segment === "campaign" && !params.campaignId) {
      return res.status(400).json({ message: "campaignId is required for campaign segment" });
    }

    const { page = "1", limit = "50", search, idsOnly } = req.query;
    const result = await getSegmentUsers(params, {
      page: Number(page),
      limit: Number(limit),
      search: typeof search === "string" ? search : undefined,
      idsOnly: idsOnly === "true" || idsOnly === "1",
    });

    return res.json(result);
  } catch (error) {
    console.error("getDonorSegmentUsers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getDonorSegmentAllIds(req: Request, res: Response) {
  try {
    const params = parseSegmentParams(req.query as Record<string, unknown>);
    if (!params) {
      return res.status(400).json({ message: "Valid segment query parameter is required" });
    }
    if (params.segment === "campaign" && !params.campaignId) {
      return res.status(400).json({ message: "campaignId is required for campaign segment" });
    }

    const ids = await getAllSegmentUserIds(params);
    return res.json({ ids, total: ids.length });
  } catch (error) {
    console.error("getDonorSegmentAllIds error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export function listDonorSegmentTypes(_req: Request, res: Response) {
  return res.json({
    segments: [
      { id: "campaign", label: "By campaign" },
      { id: "recurring", label: "Recurring donors" },
      { id: "loyal", label: "Loyal supporters" },
      { id: "at_risk", label: "At-risk subscriptions" },
      { id: "expiring_soon", label: "Expiring soon" },
      { id: "recent", label: "By donation date" },
    ].filter((s) => isDonorSegmentType(s.id)),
  });
}

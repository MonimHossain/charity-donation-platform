import { Request, Response } from "express";
import {
  getProviderStatuses,
  getStoredPaymentConfig,
  intersectGateways,
  getGloballyAvailableProviders,
  type PaymentProviderId,
} from "./paymentProviders.js";

export async function getPaymentsConfig(_req: Request, res: Response) {
  try {
    const config = await getStoredPaymentConfig();
    const providers = await getProviderStatuses();

    return res.json({
      providers: providers.map((p) => ({
        id: p.id,
        enabled: p.enabled,
        configured: p.configured,
        publicKey: p.publicKey,
      })),
      defaultCurrency: config.defaultCurrency,
      minimumDonation: config.minimumDonation,
      availableProviders: providers.filter((p) => p.enabled).map((p) => p.id),
    });
  } catch (error) {
    console.error("getPaymentsConfig error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getPaymentsConfigForCampaign(req: Request, res: Response) {
  try {
    const { gateways } = req.query;
    const campaignGateways =
      typeof gateways === "string" ? gateways.split(",").filter(Boolean) : undefined;

    const global = await getGloballyAvailableProviders();
    const available = intersectGateways(global, campaignGateways);

    const providers = await getProviderStatuses();
    const filtered = providers.filter((p) => available.includes(p.id as PaymentProviderId));

    return res.json({
      providers: filtered,
      availableProviders: available,
    });
  } catch (error) {
    console.error("getPaymentsConfigForCampaign error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAdminPaymentStatus(_req: Request, res: Response) {
  try {
    const providers = await getProviderStatuses();
    const config = await getStoredPaymentConfig();

    return res.json({
      providers,
      paymentConfig: config,
    });
  } catch (error) {
    console.error("getAdminPaymentStatus error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

import { AppDataSource } from "../../helper/connectDB.js";
import { SiteSettings } from "../../components/cms/siteSettings.entity.js";

export type PaymentProviderId = "stripe" | "paypal" | "telr" | "paytabs";

export interface PaymentConfigStored {
  enabledProviders?: PaymentProviderId[];
  stripePublicKey?: string;
  paypalClientId?: string;
  paytabsClientKey?: string;
  defaultCurrency?: string;
  minimumDonation?: number;
}

export interface ProviderStatus {
  id: PaymentProviderId;
  enabled: boolean;
  configured: boolean;
  publicKey?: string;
}

const ALL_PROVIDERS: PaymentProviderId[] = ["stripe", "paypal", "telr", "paytabs"];

export function isProviderConfigured(id: PaymentProviderId): boolean {
  switch (id) {
    case "stripe":
      return Boolean(process.env.STRIPE_SECRET_KEY);
    case "paypal":
      return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
    case "telr":
      return Boolean(process.env.TELR_STORE_ID && process.env.TELR_AUTH_KEY);
    case "paytabs":
      return Boolean(process.env.PAYTABS_PROFILE_ID && process.env.PAYTABS_SERVER_KEY);
    default:
      return false;
  }
}

export function getEnvPublicKey(id: PaymentProviderId): string | undefined {
  switch (id) {
    case "stripe":
      return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY;
    case "paypal":
      return process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    case "paytabs":
      return process.env.PAYTABS_CLIENT_KEY || process.env.NEXT_PUBLIC_PAYTABS_CLIENT_KEY;
    default:
      return undefined;
  }
}

export async function getStoredPaymentConfig(): Promise<PaymentConfigStored> {
  const repo = AppDataSource.getRepository(SiteSettings);
  const settings = await repo.findOne({ where: {} });
  const stored = (settings?.paymentConfig || {}) as PaymentConfigStored;
  return {
    enabledProviders: stored.enabledProviders?.length
      ? stored.enabledProviders
      : ["stripe"],
    stripePublicKey: stored.stripePublicKey || "",
    paypalClientId: stored.paypalClientId || "",
    paytabsClientKey: stored.paytabsClientKey || "",
    defaultCurrency: stored.defaultCurrency || "GBP",
    minimumDonation: stored.minimumDonation ?? 1,
  };
}

export async function getProviderStatuses(): Promise<ProviderStatus[]> {
  const config = await getStoredPaymentConfig();
  const enabled = new Set(config.enabledProviders || []);

  return ALL_PROVIDERS.map((id) => {
    const configured = isProviderConfigured(id);
    const publicKey =
      id === "stripe"
        ? config.stripePublicKey || getEnvPublicKey(id)
        : id === "paypal"
          ? config.paypalClientId || getEnvPublicKey(id)
          : id === "paytabs"
            ? config.paytabsClientKey || getEnvPublicKey(id)
            : undefined;

    return {
      id,
      enabled: enabled.has(id) && configured,
      configured,
      publicKey: publicKey || undefined,
    };
  });
}

/** Platform uses Stripe only (cards, Apple Pay, Google Pay). */
export async function getGloballyAvailableProviders(): Promise<PaymentProviderId[]> {
  return isProviderConfigured("stripe") ? ["stripe"] : [];
}

export function intersectGateways(
  globalProviders: PaymentProviderId[],
  campaignGateways?: string[]
): PaymentProviderId[] {
  const campaign = (campaignGateways?.length ? campaignGateways : ["stripe"]) as PaymentProviderId[];
  return globalProviders.filter((g) => campaign.includes(g));
}

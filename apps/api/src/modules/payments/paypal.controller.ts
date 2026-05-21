import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { completeDonation, failDonation } from "./paymentCompletion.js";
import { isProviderConfigured } from "./paymentProviders.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

function paypalBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(req: Request, res: Response) {
  try {
    if (!isProviderConfigured("paypal")) {
      return res.status(503).json({ message: "PayPal is not configured" });
    }

    const { amount, currency, donationId } = req.body;
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const token = await getPayPalAccessToken();
    const currencyCode = (currency || "GBP").toUpperCase();

    const orderRes = await fetch(`${paypalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currencyCode,
              value: Number(amount).toFixed(2),
            },
            custom_id: donationId || undefined,
          },
        ],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/donate/complete?provider=paypal`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/donate?cancelled=1`,
        },
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.text();
      throw new Error(err);
    }

    const order = (await orderRes.json()) as { id: string; status: string; links?: Array<{ rel: string; href: string }> };

    if (donationId) {
      await donationRepo().update(donationId, { paypalOrderId: order.id });
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId,
          type: "charge",
          provider: "paypal",
          providerTransactionId: order.id,
          amount: Number(amount),
          currency: currencyCode,
          status: "pending",
        })
      );
    }

    return res.json({
      id: order.id,
      status: order.status,
      links: order.links,
    });
  } catch (error: any) {
    console.error("Create PayPal order error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function capturePayPalOrder(req: Request, res: Response) {
  try {
    if (!isProviderConfigured("paypal")) {
      return res.status(503).json({ message: "PayPal is not configured" });
    }

    const { orderId, donationId } = req.body;
    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    const token = await getPayPalAccessToken();
    const captureRes = await fetch(`${paypalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const err = await captureRes.text();
      throw new Error(err);
    }

    const capture = (await captureRes.json()) as {
      id: string;
      status: string;
      purchase_units?: Array<{
        payments?: { captures?: Array<{ id: string; amount: { value: string; currency_code: string } }> };
        custom_id?: string;
      }>;
    };

    const unit = capture.purchase_units?.[0];
    const captureId = unit?.payments?.captures?.[0]?.id;
    const resolvedDonationId =
      donationId || unit?.custom_id || (await donationRepo().findOne({ where: { paypalOrderId: orderId } }))?.id;

    if (resolvedDonationId && capture.status === "COMPLETED") {
      await completeDonation(resolvedDonationId);
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: resolvedDonationId,
          type: "charge",
          provider: "paypal",
          providerTransactionId: captureId || orderId,
          amount: Number(unit?.payments?.captures?.[0]?.amount?.value || 0),
          currency: unit?.payments?.captures?.[0]?.amount?.currency_code || "GBP",
          status: "succeeded",
        })
      );
    }

    return res.json(capture);
  } catch (error: any) {
    console.error("Capture PayPal order error:", error);
    if (req.body.donationId) await failDonation(req.body.donationId);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    const event = req.body;
    console.log("PayPal webhook received:", event.event_type);

    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const resource = event.resource;
      const customId = resource?.custom_id;
      const donation = customId
        ? await donationRepo().findOne({ where: { id: customId } })
        : await donationRepo().findOne({ where: { paypalOrderId: resource?.supplementary_data?.related_ids?.order_id } });

      if (donation) {
        await completeDonation(donation.id);
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("PayPal webhook error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

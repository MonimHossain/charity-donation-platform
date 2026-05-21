import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { completeDonation, failDonation } from "./paymentCompletion.js";
import { isProviderConfigured } from "./paymentProviders.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

const TELR_API = "https://secure.telr.com/gateway/order.json";

export async function initTelrPayment(req: Request, res: Response) {
  try {
    if (!isProviderConfigured("telr")) {
      return res.status(503).json({ message: "Telr is not configured" });
    }

    const { donationId, amount, currency, returnUrl, cancelUrl } = req.body;
    if (!donationId || !amount) {
      return res.status(400).json({ message: "donationId and amount are required" });
    }

    const donation = await donationRepo().findOne({ where: { id: donationId } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
    const cartId = `don-${donationId.slice(0, 8)}-${Date.now()}`;

    const body = {
      method: "create",
      store: process.env.TELR_STORE_ID,
      authkey: process.env.TELR_AUTH_KEY,
      framed: 0,
      order: {
        cartid: cartId,
        test: process.env.TELR_TEST_MODE === "true" ? "1" : "0",
        amount: Number(amount).toFixed(2),
        currency: (currency || donation.currency || "GBP").toUpperCase(),
        description: `Donation ${donation.receiptNumber || donationId}`,
      },
      return: {
        authorised: returnUrl || `${appUrl}/donate/complete?provider=telr&donationId=${donationId}`,
        declined: cancelUrl || `${appUrl}/donate?cancelled=1`,
        cancelled: cancelUrl || `${appUrl}/donate?cancelled=1`,
      },
    };

    const telrRes = await fetch(TELR_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await telrRes.json()) as {
      order?: { ref?: string; url?: string };
      error?: { message?: string };
    };

    if (!telrRes.ok || !data.order?.url) {
      throw new Error(data.error?.message || "Telr session creation failed");
    }

    await donationRepo().update(donationId, { telrOrderRef: data.order.ref || cartId });
    await paymentLogRepo().save(
      paymentLogRepo().create({
        donationId,
        type: "charge",
        provider: "telr",
        providerTransactionId: data.order.ref || cartId,
        amount: Number(amount),
        currency: currency || donation.currency,
        status: "pending",
      })
    );

    return res.json({
      redirectUrl: data.order.url,
      orderRef: data.order.ref,
    });
  } catch (error: any) {
    console.error("Telr init error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function handleTelrWebhook(req: Request, res: Response) {
  try {
    const payload = req.body;
    const cartId = payload.cartid || payload.ivp_cart;
    const status = payload.tran_status || payload.status;

    if (!cartId) {
      return res.status(400).json({ message: "Missing cart reference" });
    }

    const donation = await donationRepo().findOne({
      where: [{ telrOrderRef: cartId }],
    });

    if (!donation) {
      return res.json({ received: true });
    }

    if (status === "A" || status === "authorised" || status === "paid") {
      await completeDonation(donation.id);
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: donation.id,
          type: "charge",
          provider: "telr",
          providerTransactionId: payload.tranref || cartId,
          amount: Number(donation.totalAmount),
          currency: donation.currency,
          status: "succeeded",
        })
      );
    } else if (status === "D" || status === "declined" || status === "cancelled") {
      await failDonation(donation.id);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Telr webhook error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** Return URL handler — complete if Telr reports success via query params */
export async function handleTelrReturn(req: Request, res: Response) {
  try {
    const { donationId, status } = req.query;
    if (!donationId || typeof donationId !== "string") {
      return res.status(400).json({ message: "donationId required" });
    }

    if (status === "A" || status === "authorised") {
      await completeDonation(donationId);
    }

    const donation = await donationRepo().findOne({ where: { id: donationId } });
    return res.json({ status: donation?.status || "pending" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

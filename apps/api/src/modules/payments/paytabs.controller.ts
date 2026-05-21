import { Request, Response } from "express";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { completeDonation, failDonation } from "./paymentCompletion.js";
import { isProviderConfigured } from "./paymentProviders.js";

const donationRepo = () => AppDataSource.getRepository(Donation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

function paytabsApiUrl(): string {
  const region = (process.env.PAYTABS_REGION || "ARE").toUpperCase();
  const hosts: Record<string, string> = {
    ARE: "https://secure.paytabs.com",
    SAU: "https://secure.paytabs.sa",
    OMN: "https://secure-oman.paytabs.com",
    JOR: "https://secure-jordan.paytabs.com",
    EGY: "https://secure-egypt.paytabs.com",
  };
  return hosts[region] || hosts.ARE;
}

export async function initPayTabsPayment(req: Request, res: Response) {
  try {
    if (!isProviderConfigured("paytabs")) {
      return res.status(503).json({ message: "PayTabs is not configured" });
    }

    const { donationId, amount, currency, returnUrl } = req.body;
    if (!donationId || !amount) {
      return res.status(400).json({ message: "donationId and amount are required" });
    }

    const donation = await donationRepo().findOne({ where: { id: donationId } });
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3001";
    const cartId = `don-${donationId.slice(0, 8)}-${Date.now()}`;

    const payload = {
      profile_id: Number(process.env.PAYTABS_PROFILE_ID),
      tran_type: "sale",
      tran_class: "ecom",
      cart_id: cartId,
      cart_description: `Donation ${donation.receiptNumber || donationId}`,
      cart_currency: (currency || donation.currency || "GBP").toUpperCase(),
      cart_amount: Number(amount),
      return: returnUrl || `${appUrl}/donate/complete?provider=paytabs&donationId=${donationId}`,
      callback: `${process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000"}/api/v1/payments/paytabs/callback`,
      customer_details: {
        name: donation.donorName,
        email: donation.donorEmail,
        phone: donation.donorPhone || "",
        street1: "N/A",
        city: "N/A",
        state: "N/A",
        country: "GB",
        zip: "00000",
      },
    };

    const ptRes = await fetch(`${paytabsApiUrl()}/payment/request`, {
      method: "POST",
      headers: {
        Authorization: process.env.PAYTABS_SERVER_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = (await ptRes.json()) as {
      redirect_url?: string;
      tran_ref?: string;
      code?: number;
      message?: string;
    };

    if (!ptRes.ok || !data.redirect_url) {
      throw new Error(data.message || "PayTabs session creation failed");
    }

    await donationRepo().update(donationId, { paytabsTransactionRef: data.tran_ref || cartId });
    await paymentLogRepo().save(
      paymentLogRepo().create({
        donationId,
        type: "charge",
        provider: "paytabs",
        providerTransactionId: data.tran_ref || cartId,
        amount: Number(amount),
        currency: currency || donation.currency,
        status: "pending",
      })
    );

    return res.json({
      redirectUrl: data.redirect_url,
      transactionRef: data.tran_ref,
    });
  } catch (error: any) {
    console.error("PayTabs init error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function handlePayTabsCallback(req: Request, res: Response) {
  try {
    const payload = req.body;
    const cartId = payload.cart_id;
    const paymentResult = payload.payment_result;
    const responseStatus = paymentResult?.response_status || payload.response_status;
    const tranRef = paymentResult?.transaction_reference || payload.tran_ref;

    let donation = tranRef
      ? await donationRepo().findOne({ where: { paytabsTransactionRef: tranRef } })
      : null;
    if (!donation && cartId) {
      donation = await donationRepo().findOne({ where: { paytabsTransactionRef: cartId } });
    }

    if (donation && (responseStatus === "A" || responseStatus === "Authorised")) {
      await completeDonation(donation.id);
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: donation.id,
          type: "charge",
          provider: "paytabs",
          providerTransactionId: tranRef || cartId,
          amount: Number(donation.totalAmount),
          currency: donation.currency,
          status: "succeeded",
        })
      );
    } else if (donation) {
      await failDonation(donation.id);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("PayTabs callback error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

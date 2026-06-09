import { Request, Response } from "express";
import Stripe from "stripe";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { completeDonation, failDonation } from "./paymentCompletion.js";
import { sendRecurringFailedPaymentEmail } from "../../helper/mailer.js";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

const donationRepo = () => AppDataSource.getRepository(Donation);
const recurringRepo = () => AppDataSource.getRepository(RecurringDonation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency, donationId, metadata } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: (currency || "gbp").toLowerCase(),
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        donationId: donationId || "",
        ...metadata,
      },
    });

    if (donationId) {
      await donationRepo().update(donationId, { stripePaymentIntentId: paymentIntent.id });
    }

    await paymentLogRepo().save(
      paymentLogRepo().create({
        donationId,
        type: "charge",
        provider: "stripe",
        providerTransactionId: paymentIntent.id,
        amount,
        currency: currency || "GBP",
        status: "pending",
      })
    );

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function createSubscription(req: Request, res: Response) {
  try {
    const { email, name, paymentMethodId, amount, currency, interval, recurringDonationId } = req.body;

    if (!email || !paymentMethodId || !amount) {
      return res.status(400).json({ message: "Email, payment method, and amount are required" });
    }

    const stripe = getStripe();

    const customer = await stripe.customers.create({
      email,
      name,
      payment_method: paymentMethodId,
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const price = await stripe.prices.create({
      unit_amount: Math.round(amount * 100),
      currency: (currency || "gbp").toLowerCase(),
      recurring: { interval: interval || "month" },
      product_data: { name: "Recurring Donation" },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: price.id }],
      metadata: { recurringDonationId: recurringDonationId || "" },
      expand: ["latest_invoice.payment_intent"],
    });

    if (recurringDonationId) {
      await recurringRepo().update(recurringDonationId, {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });
    }

    return res.json({
      subscriptionId: subscription.id,
      customerId: customer.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

export async function handleWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const skipVerify =
    !endpointSecret ||
    endpointSecret === "whsec_xxx" ||
    process.env.STRIPE_WEBHOOK_SKIP_VERIFY === "true";

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    if (skipVerify) {
      const raw =
        typeof req.body === "string"
          ? req.body
          : Buffer.isBuffer(req.body)
            ? req.body.toString("utf8")
            : JSON.stringify(req.body);
      event = JSON.parse(raw) as Stripe.Event;
      if (process.env.NODE_ENV !== "production") {
        console.warn("[stripe] Webhook signature verification skipped (dev / no whsec configured)");
      }
    } else {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const donationId = pi.metadata.donationId;

        if (donationId) {
          await donationRepo().update(donationId, { stripePaymentIntentId: pi.id });
          await completeDonation(donationId);
        }

        await paymentLogRepo().save(
          paymentLogRepo().create({
            donationId: donationId || undefined,
            type: "charge",
            provider: "stripe",
            providerTransactionId: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency.toUpperCase(),
            status: "succeeded",
          })
        );
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const donationId = pi.metadata.donationId;

        if (donationId) {
          await failDonation(donationId);
        }

        await paymentLogRepo().save(
          paymentLogRepo().create({
            donationId: donationId || undefined,
            type: "failed",
            provider: "stripe",
            providerTransactionId: pi.id,
            amount: pi.amount / 100,
            currency: pi.currency.toUpperCase(),
            status: "failed",
            errorMessage: pi.last_payment_error?.message,
          })
        );
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const recurringId = sub.metadata.recurringDonationId;
        if (recurringId) {
          await recurringRepo().update(recurringId, { status: sub.status === "active" ? "active" : "paused" });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const recurringId = sub.metadata.recurringDonationId;
        if (recurringId) {
          await recurringRepo().update(recurringId, { status: "cancelled", cancelledAt: new Date() });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.subscription as string;
        if (sub) {
          const recurring = await recurringRepo().findOneBy({ stripeSubscriptionId: sub });
          if (recurring) {
            recurring.lastPaymentDate = new Date();
            recurring.totalPayments += 1;
            recurring.totalPaid = Number(recurring.totalPaid) + (invoice.amount_paid / 100);
            recurring.failedAttempts = 0;

            const next = new Date();
            if (recurring.frequency === "weekly") next.setDate(next.getDate() + 7);
            else if (recurring.frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
            else next.setMonth(next.getMonth() + 1);
            recurring.nextPaymentDate = next;

            await recurringRepo().save(recurring);

            await paymentLogRepo().save(
              paymentLogRepo().create({
                recurringDonationId: recurring.id,
                type: "charge",
                provider: "stripe",
                providerTransactionId: invoice.id,
                amount: invoice.amount_paid / 100,
                currency: (invoice.currency || "gbp").toUpperCase(),
                status: "succeeded",
              })
            );
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const sub = invoice.subscription as string;
        if (sub) {
          const recurring = await recurringRepo().findOneBy({ stripeSubscriptionId: sub });
          if (recurring) {
            recurring.failedAttempts += 1;
            if (recurring.failedAttempts >= 3) {
              recurring.status = "failed";
            }
            await recurringRepo().save(recurring);

            try {
              await sendRecurringFailedPaymentEmail(recurring);
            } catch (emailErr) {
              console.error("[webhook] Failed payment email error:", emailErr);
            }

            await paymentLogRepo().save(
              paymentLogRepo().create({
                recurringDonationId: recurring.id,
                type: "failed",
                provider: "stripe",
                providerTransactionId: invoice.id,
                amount: (invoice.amount_due || 0) / 100,
                currency: (invoice.currency || "gbp").toUpperCase(),
                status: "failed",
              })
            );
          }
        }
        break;
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ message: "Webhook processing error" });
  }
}

export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { intentId } = req.params;
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    return res.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
    });
  } catch (error: any) {
    console.error("Get payment status error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

/** Client-side confirmation after Payment Element succeeds (works without webhooks in dev). */
export async function confirmStripePayment(req: Request, res: Response) {
  try {
    const { paymentIntentId, donationId } = req.body as {
      paymentIntentId?: string;
      donationId?: string;
    };

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const resolvedDonationId = donationId || paymentIntent.metadata?.donationId;

    if (paymentIntent.status === "succeeded") {
      if (resolvedDonationId) {
        await completeDonation(resolvedDonationId);
      }
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: resolvedDonationId || undefined,
          type: "charge",
          provider: "stripe",
          providerTransactionId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency.toUpperCase(),
          status: "succeeded",
        })
      );
      return res.json({
        status: "succeeded",
        donationId: resolvedDonationId,
        paymentIntentId: paymentIntent.id,
      });
    }

    if (paymentIntent.status === "processing") {
      return res.json({ status: "processing", donationId: resolvedDonationId });
    }

    return res.status(400).json({
      status: paymentIntent.status,
      message: paymentIntent.last_payment_error?.message || "Payment not completed",
    });
  } catch (error: any) {
    console.error("confirmStripePayment error:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}

import { Request, Response } from "express";
import { routeParam } from "../../helper/requestParams.js";
import type Stripe from "stripe";
import { AppDataSource } from "../../helper/connectDB.js";
import { Donation } from "../../components/donation/donation.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { PaymentLog } from "../../components/paymentLog/paymentLog.entity.js";
import { completeDonation, failDonation } from "./paymentCompletion.js";
import { dispatchEvent } from "../notifications/notification.service.js";
import { createStripeClient } from "../../helper/stripeClient.js";
import { User } from "../../components/user/user.entity.js";
import { issueUserSession, createUserToken } from "../user-auth/userAuth.service.js";
import {
  createStripeCustomerSession,
  getOrCreateStripeCustomerForUser,
  persistStripeCustomerFromPaymentIntent,
} from "./stripeCustomer.js";
import {
  activateSchedulesFromStripePayment,
  activateSchedulesFromStripeSetup,
} from "../automated/automatedPayment.service.js";

const getStripe = () => createStripeClient(process.env.STRIPE_SECRET_KEY!);

const donationRepo = () => AppDataSource.getRepository(Donation);
const recurringRepo = () => AppDataSource.getRepository(RecurringDonation);
const paymentLogRepo = () => AppDataSource.getRepository(PaymentLog);

async function buildDonorSessionPayload(donationId?: string) {
  if (!donationId) return {};
  const donation = await donationRepo().findOne({ where: { id: donationId } });
  if (!donation?.userId) return {};

  const user = await AppDataSource.getRepository(User).findOne({ where: { id: donation.userId } });
  if (!user) return {};

  const session = createUserToken(user);
  return { token: session.token, user: session.user };
}

export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency, donationId, automatedScheduleId, automatedScheduleIds, donorEmail, donorName, metadata } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const scheduleIds = (
      Array.isArray(automatedScheduleIds)
        ? automatedScheduleIds
        : automatedScheduleId
          ? [automatedScheduleId]
          : []
    ).filter(Boolean);

    const stripe = getStripe();
    const userId = (req as { user?: { id?: string } }).user?.id;
    let customerId: string | undefined;

    if (userId) {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) {
        customerId = await getOrCreateStripeCustomerForUser(user);
      }
    }

    if (!customerId && scheduleIds.length) {
      const donation = donationId
        ? await donationRepo().findOne({ where: { id: donationId } })
        : null;
      const email = String(donorEmail || donation?.donorEmail || "").trim();
      const name = String(donorName || donation?.donorName || "").trim();
      if (email) {
        const customer = await stripe.customers.create({
          email,
          name: name || undefined,
          metadata: { userId: userId || "", donationId: donationId || "" },
        });
        customerId = customer.id;
      }
    }

    const installmentLabel =
      metadata && typeof metadata.installmentLabel === "string"
        ? metadata.installmentLabel
        : scheduleIds.length
          ? "Ramadan split — night 1"
          : undefined;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: (currency || "gbp").toLowerCase(),
      payment_method_types: ["card"],
      ...(installmentLabel ? { description: installmentLabel } : {}),
      ...(customerId ? { customer: customerId } : {}),
      ...(customerId && scheduleIds.length > 0
        ? { setup_future_usage: "off_session" }
        : {}),
      metadata: {
        donationId: donationId || "",
        automatedScheduleId: scheduleIds[0] || "",
        automatedScheduleIds: scheduleIds.join(","),
        userId: userId || "",
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

function stripeRecurringFromFrequency(
  frequency: string,
  options?: { interval?: string; intervalCount?: number; cancelAt?: number }
): Stripe.PriceCreateParams.Recurring {
  if (options?.interval) {
    const interval = options.interval as Stripe.PriceCreateParams.Recurring["interval"];
    const intervalCount = Math.max(1, Number(options.intervalCount ?? 1));
    return intervalCount > 1 ? { interval, interval_count: intervalCount } : { interval };
  }

  const customMatch = /^custom:(\d+):(day|week|month|year)$/.exec(frequency);
  if (customMatch) {
    const interval = customMatch[2] as Stripe.PriceCreateParams.Recurring["interval"];
    const intervalCount = Number(customMatch[1]);
    return intervalCount > 1 ? { interval, interval_count: intervalCount } : { interval };
  }

  const f = frequency === "annually" ? "yearly" : frequency;
  if (f === "daily") return { interval: "day" };
  if (f === "weekly") return { interval: "week" };
  if (f === "yearly") return { interval: "year" };
  if (f === "quarterly") return { interval: "month", interval_count: 3 };
  return { interval: "month" };
}

/** Create an incomplete Stripe subscription and return the first invoice PaymentIntent client secret. */
export async function createSubscriptionCheckout(req: Request, res: Response) {
  try {
    const {
      amount,
      currency,
      frequency,
      interval,
      intervalCount,
      cancelAt,
      donorEmail,
      donorName,
      recurringDonationId,
      donationId,
      campaignId,
    } = req.body;

    if (!amount || !donorEmail || !donorName) {
      return res.status(400).json({ message: "Amount, donor email, and name are required" });
    }

    const stripe = getStripe();
    const userId = (req as { user?: { id?: string } }).user?.id;
    let customer: Stripe.Customer;

    if (userId) {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) {
        const customerId = await getOrCreateStripeCustomerForUser(user);
        customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
      } else {
        customer = await stripe.customers.create({
          email: donorEmail,
          name: donorName,
          metadata: {
            recurringDonationId: recurringDonationId || "",
            donationId: donationId || "",
          },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: donorEmail,
        name: donorName,
        metadata: {
          recurringDonationId: recurringDonationId || "",
          donationId: donationId || "",
        },
      });
    }

    const price = await stripe.prices.create({
      unit_amount: Math.round(Number(amount) * 100),
      currency: (currency || "gbp").toLowerCase(),
      recurring: stripeRecurringFromFrequency(frequency || "monthly", {
        interval,
        intervalCount,
      }),
      product_data: { name: "Recurring Donation" },
    });

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        recurringDonationId: recurringDonationId || "",
        donationId: donationId || "",
        campaignId: campaignId || "",
      },
    };

    if (cancelAt) {
      subscriptionParams.cancel_at = Number(cancelAt);
    }

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    if (!paymentIntent?.client_secret) {
      return res.status(500).json({ message: "Could not initialize subscription payment" });
    }

    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        donationId: donationId || "",
        recurringDonationId: recurringDonationId || "",
        subscriptionId: subscription.id,
      },
    });

    if (recurringDonationId) {
      await recurringRepo().update(recurringDonationId, {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
      });
    }

    if (userId && customer.id) {
      const linkedUser = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (linkedUser && linkedUser.stripeCustomerId !== customer.id) {
        linkedUser.stripeCustomerId = customer.id;
        await AppDataSource.getRepository(User).save(linkedUser);
      }
    }

    if (donationId) {
      await donationRepo().update(donationId, { stripePaymentIntentId: paymentIntent.id });
    }

    await paymentLogRepo().save(
      paymentLogRepo().create({
        donationId: donationId || undefined,
        recurringDonationId: recurringDonationId || undefined,
        type: "charge",
        provider: "stripe",
        providerTransactionId: paymentIntent.id,
        amount: Number(amount),
        currency: (currency || "GBP").toUpperCase(),
        status: "pending",
      })
    );

    return res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subscriptionId: subscription.id,
      customerId: customer.id,
    });
  } catch (error: any) {
    console.error("Create subscription checkout error:", error);
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
              await dispatchEvent("payment_failed", {
                donorEmail: recurring.donorEmail,
                donorName: recurring.donorName,
                amount: Number(recurring.amount),
                currency: recurring.currency,
                userId: recurring.userId,
                isRecurring: true,
              });
            } catch (emailErr) {
              console.error("[webhook] Failed payment notification error:", emailErr);
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
    const intentId = routeParam(req, 'intentId');
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
    const { paymentIntentId, donationId, recurringDonationId, subscriptionId } = req.body as {
      paymentIntentId?: string;
      donationId?: string;
      recurringDonationId?: string;
      subscriptionId?: string;
    };

    if (!paymentIntentId) {
      return res.status(400).json({ message: "paymentIntentId is required" });
    }

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const resolvedDonationId = donationId || paymentIntent.metadata?.donationId;
    const resolvedRecurringId =
      recurringDonationId || paymentIntent.metadata?.recurringDonationId;
    const resolvedSubscriptionId =
      subscriptionId || paymentIntent.metadata?.subscriptionId;

    if (paymentIntent.status === "succeeded") {
      const userId =
        (req as { user?: { id?: string } }).user?.id || paymentIntent.metadata?.userId;
      await persistStripeCustomerFromPaymentIntent(paymentIntent, userId);

      const scheduleIds = String(
        paymentIntent.metadata?.automatedScheduleIds || paymentIntent.metadata?.automatedScheduleId || ""
      )
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      if (scheduleIds.length) {
        await activateSchedulesFromStripePayment(scheduleIds, paymentIntent);
      }

      if (resolvedDonationId) {
        await completeDonation(resolvedDonationId);
      }
      if (resolvedRecurringId) {
        const recurring = await recurringRepo().findOneBy({ id: resolvedRecurringId });
        if (recurring) {
          recurring.status = "active";
          if (resolvedSubscriptionId) {
            recurring.stripeSubscriptionId = resolvedSubscriptionId;
          }
          recurring.lastPaymentDate = new Date();
          recurring.totalPayments = (recurring.totalPayments || 0) + 1;
          recurring.totalPaid =
            Number(recurring.totalPaid || 0) + paymentIntent.amount / 100;
          recurring.failedAttempts = 0;
          const next = new Date();
          if (recurring.frequency === "weekly") next.setDate(next.getDate() + 7);
          else if (recurring.frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
          else if (recurring.frequency === "quarterly") next.setMonth(next.getMonth() + 3);
          else next.setMonth(next.getMonth() + 1);
          recurring.nextPaymentDate = next;
          await recurringRepo().save(recurring);
        }
      }
      await paymentLogRepo().save(
        paymentLogRepo().create({
          donationId: resolvedDonationId || undefined,
          recurringDonationId: resolvedRecurringId || undefined,
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
        recurringDonationId: resolvedRecurringId,
        subscriptionId: resolvedSubscriptionId,
        paymentIntentId: paymentIntent.id,
        ...(await buildDonorSessionPayload(resolvedDonationId)),
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

export async function createSetupIntent(req: Request, res: Response) {
  try {
    const { automatedScheduleId, automatedScheduleIds, donationId, currency = "gbp" } = req.body;
    const scheduleIds = (
      Array.isArray(automatedScheduleIds)
        ? automatedScheduleIds
        : automatedScheduleId
          ? [automatedScheduleId]
          : []
    ).filter(Boolean);
    if (!scheduleIds.length) {
      return res.status(400).json({ message: "automatedScheduleId is required" });
    }

    const stripe = getStripe();
    const userId = (req as { user?: { id?: string } }).user?.id;
    let customerId: string | undefined;

    if (userId) {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) {
        customerId = await getOrCreateStripeCustomerForUser(user);
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId: userId || "" } });
      customerId = customer.id;
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        automatedScheduleId: scheduleIds[0],
        automatedScheduleIds: scheduleIds.join(","),
        donationId: donationId || "",
        userId: userId || "",
        currency: String(currency).toLowerCase(),
      },
    });

    return res.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
      customerId,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("createSetupIntent error:", error);
    return res.status(500).json({ message });
  }
}

export async function confirmStripeSetup(req: Request, res: Response) {
  try {
    const { setupIntentId, automatedScheduleId, automatedScheduleIds, donationId } = req.body as {
      setupIntentId?: string;
      automatedScheduleId?: string;
      automatedScheduleIds?: string[];
      donationId?: string;
    };

    if (!setupIntentId) {
      return res.status(400).json({ message: "setupIntentId is required" });
    }

    const stripe = getStripe();
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
    const resolvedScheduleIds = (
      Array.isArray(automatedScheduleIds) && automatedScheduleIds.length
        ? automatedScheduleIds
        : String(automatedScheduleId || setupIntent.metadata?.automatedScheduleIds || setupIntent.metadata?.automatedScheduleId || "")
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
    );
    const resolvedDonationId = donationId || setupIntent.metadata?.donationId;

    if (setupIntent.status !== "succeeded") {
      return res.status(400).json({
        status: setupIntent.status,
        message: "Payment method was not saved",
      });
    }

    const customerId =
      typeof setupIntent.customer === "string"
        ? setupIntent.customer
        : setupIntent.customer?.id;
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;

    if (resolvedScheduleIds.length && customerId && paymentMethodId) {
      await activateSchedulesFromStripeSetup(resolvedScheduleIds, customerId, paymentMethodId);
    }

    if (resolvedDonationId) {
      const donation = await donationRepo().findOne({ where: { id: resolvedDonationId } });
      if (donation && donation.status !== "completed") {
        donation.status = "completed";
        await donationRepo().save(donation);
      }
    }

    const userId = (req as { user?: { id?: string } }).user?.id || setupIntent.metadata?.userId;
    if (userId && customerId) {
      const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user && user.stripeCustomerId !== customerId) {
        user.stripeCustomerId = customerId;
        await AppDataSource.getRepository(User).save(user);
      }
    }

    return res.json({
      status: "succeeded",
      automatedScheduleId: resolvedScheduleIds[0],
      automatedScheduleIds: resolvedScheduleIds,
      donationId: resolvedDonationId,
      setupIntentId: setupIntent.id,
      ...(await buildDonorSessionPayload(resolvedDonationId)),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("confirmStripeSetup error:", error);
    return res.status(500).json({ message });
  }
}

export async function getStripeCustomerSession(req: Request, res: Response) {
  try {
    const userId = (req as { user?: { id?: string } }).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const user = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const customerId = await getOrCreateStripeCustomerForUser(user);
    const customerSessionClientSecret = await createStripeCustomerSession(customerId);

    return res.json({ customerId, customerSessionClientSecret });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("getStripeCustomerSession error:", error);
    return res.status(500).json({ message });
  }
}

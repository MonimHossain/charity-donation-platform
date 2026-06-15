import type Stripe from "stripe";
import { AppDataSource } from "../../helper/connectDB.js";
import { User } from "../../components/user/user.entity.js";
import { RecurringDonation } from "../../components/recurringDonation/recurringDonation.entity.js";
import { createStripeClient } from "../../helper/stripeClient.js";

const getStripe = () => createStripeClient(process.env.STRIPE_SECRET_KEY!);

export async function getOrCreateStripeCustomerForUser(user: User): Promise<string> {
  const userRepo = AppDataSource.getRepository(User);

  if (user.stripeCustomerId) {
    try {
      const stripe = getStripe();
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch {
      /* fall through and recreate */
    }
  }

  const recurringRepo = AppDataSource.getRepository(RecurringDonation);
  const recurring = await recurringRepo.findOne({
    where: { userId: user.id },
    order: { createdAt: "DESC" },
  });
  if (recurring?.stripeCustomerId) {
    user.stripeCustomerId = recurring.stripeCustomerId;
    await userRepo.save(user);
    return recurring.stripeCustomerId;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.fullName,
    metadata: { userId: user.id },
  });

  user.stripeCustomerId = customer.id;
  await userRepo.save(user);
  return customer.id;
}

export async function createStripeCustomerSession(customerId: string): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.customerSessions.create({
    customer: customerId,
    components: {
      payment_element: {
        enabled: true,
        features: {
          payment_method_save: "enabled",
          payment_method_save_usage: "off_session",
          payment_method_redisplay: "enabled",
          payment_method_allow_redisplay_filters: ["always", "limited", "unspecified"],
        },
      },
    },
  });

  if (!session.client_secret) {
    throw new Error("Could not create Stripe customer session");
  }

  return session.client_secret;
}

export async function persistStripeCustomerFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  userId?: string
): Promise<void> {
  if (!userId) return;
  const customerId =
    typeof paymentIntent.customer === "string"
      ? paymentIntent.customer
      : paymentIntent.customer?.id;
  if (!customerId) return;

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user || user.stripeCustomerId === customerId) return;

  user.stripeCustomerId = customerId;
  await userRepo.save(user);
}

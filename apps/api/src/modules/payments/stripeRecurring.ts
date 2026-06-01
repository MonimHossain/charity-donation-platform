import Stripe from "stripe";

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

export async function pauseStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: { behavior: "mark_uncollectible" },
  });
}

export async function resumeStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, {
    pause_collection: "",
  } as Stripe.SubscriptionUpdateParams);
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.cancel(subscriptionId);
}

export async function createStripeBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

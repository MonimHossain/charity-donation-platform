import dns from "dns";
import { readFileSync } from "fs";
import Stripe from "stripe";

dns.setDefaultResultOrder("ipv6first");

const env = readFileSync("/home/deployment/production/your-impact/.env", "utf8");
const key = env.match(/STRIPE_SECRET_KEY=(.+)/)?.[1]?.trim();
if (!key) {
  console.error("NO_KEY");
  process.exit(1);
}

const stripe = new Stripe(key);
try {
  const pi = await stripe.paymentIntents.create({
    amount: 5000,
    currency: "gbp",
    automatic_payment_methods: { enabled: true },
  });
  console.log("NODE_OK", pi.id);
} catch (error) {
  console.error("NODE_ERR", error.message);
  process.exit(1);
}

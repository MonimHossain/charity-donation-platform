#!/bin/bash
set -euo pipefail

echo "=== WARP ==="
warp-cli settings list 2>&1 || true
warp-cli status 2>&1 || true

echo "=== STRIPE NODE ==="
cd /home/deployment/production/your-impact/apps/api
timeout 25 node --input-type=module <<'NODE'
import Stripe from "stripe";
import { readFileSync } from "fs";
const env = readFileSync("/home/deployment/production/your-impact/.env", "utf8");
const key = env.split("\n").find((l) => l.startsWith("STRIPE_SECRET_KEY="))?.slice(18)?.trim();
const stripe = new Stripe(key);
try {
  const pi = await stripe.paymentIntents.create({
    amount: 5000,
    currency: "gbp",
    automatic_payment_methods: { enabled: true },
  });
  console.log("NODE_OK", pi.id);
} catch (e) {
  console.log("NODE_ERR", e.code, e.message);
}
NODE

echo "=== LOCAL CREATE INTENT ==="
DON=$(curl -s -X POST http://127.0.0.1:4000/api/v1/donations \
  -H 'Content-Type: application/json' \
  -d '{"amount":50,"currency":"GBP","donorEmail":"t@t.com","donorName":"T"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')
echo "donation=$DON"
curl -s --max-time 30 -X POST http://127.0.0.1:4000/api/v1/payments/stripe/create-intent \
  -H 'Content-Type: application/json' \
  -d "{\"donationId\":\"$DON\",\"amount\":50,\"currency\":\"GBP\"}" \
  -w '\nHTTP:%{http_code}\n'

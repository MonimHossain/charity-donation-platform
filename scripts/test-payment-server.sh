#!/bin/bash
set -euo pipefail

warp-cli settings accept-tos true 2>/dev/null || true
warp-cli registration new 2>/dev/null || true
warp-cli mode warp 2>/dev/null || true
warp-cli connect 2>/dev/null || true
sleep 3
warp-cli status || true

echo "--- stripe curl ---"
curl -4 -s -o /dev/null -w 'stripe:%{http_code} time:%{time_total}\n' --max-time 15 https://api.stripe.com || true

echo "--- local payment intent ---"
DON=$(curl -s -X POST http://127.0.0.1:4000/api/v1/donations \
  -H 'Content-Type: application/json' \
  -d '{"amount":50,"currency":"GBP","donorEmail":"t@t.com","donorName":"T"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["id"])')

curl -s --max-time 30 -X POST http://127.0.0.1:4000/api/v1/payments/stripe/create-intent \
  -H 'Content-Type: application/json' \
  -d "{\"donationId\":\"$DON\",\"amount\":50,\"currency\":\"GBP\"}" \
  -w '\nHTTP:%{http_code}\n' | tail -5

sudo -u jenkins pm2 restart your-impact-api-prod --update-env
sleep 3
echo PAYMENT_TEST_DONE

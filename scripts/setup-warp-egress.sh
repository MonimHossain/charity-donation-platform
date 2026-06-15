#!/bin/bash
set -euo pipefail

# Fix outbound IPv4 egress via Cloudflare WARP (Hostinger VPS blocks direct AWS/Stripe).
export DEBIAN_FRONTEND=noninteractive

curl -fsSL https://pkg.cloudflareclient.com/pubkey.gpg -o /tmp/cloudflare-warp.gpg
gpg --batch --yes --dearmor -o /usr/share/keyrings/cloudflare-warp-archive-keyring.gpg /tmp/cloudflare-warp.gpg

cat > /etc/apt/sources.list.d/cloudflare-client.list <<'EOF'
deb [signed-by=/usr/share/keyrings/cloudflare-warp-archive-keyring.gpg] https://pkg.cloudflareclient.com/ noble main
EOF

apt-get update -qq
apt-get install -y -qq cloudflare-warp

warp-cli --version
warp-cli registration new --accept-tos || warp-cli registration new || true
warp-cli mode warp || true
warp-cli connect || true
sleep 3
warp-cli status

curl -4 -s -o /dev/null -w 'stripe:%{http_code} time:%{time_total}\n' --max-time 15 https://api.stripe.com
echo WARP_SETUP_DONE

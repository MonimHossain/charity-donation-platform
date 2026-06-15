#!/bin/bash
# One-time domain + SSL setup on the production VPS.
set -euo pipefail

DOMAIN="yourimpactdev.com"
EMAIL="${CERTBOT_EMAIL:-admin@yourimpactdev.com}"

echo "==> Testing nginx config"
nginx -t
systemctl reload nginx

echo "==> Opening firewall port 443"
ufw allow 443/tcp || true

echo "==> Installing certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

echo "==> Obtaining SSL certificate"
certbot --nginx \
  -d "$DOMAIN" \
  -d "www.$DOMAIN" \
  --non-interactive \
  --agree-tos \
  --email "$EMAIL" \
  --redirect

echo "==> Verifying auto-renewal"
certbot renew --dry-run

echo "==> Done. https://$DOMAIN should be live."

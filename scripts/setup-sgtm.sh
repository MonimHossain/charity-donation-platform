#!/usr/bin/env bash
set -euo pipefail

# Server-side GTM setup for Ubuntu + Nginx.
# Run on the VPS as root (or with sudo):
#   sudo bash scripts/setup-sgtm.sh
#
# Prerequisites:
#   - DNS A record: assets.yourimpactdev.com → this VPS IP
#   - Docker + docker compose plugin installed
#   - Nginx installed

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SGTM_DIR="/opt/sgtm-server"
NGINX_SITE="assets.yourimpactdev.com"
WEB_GTM_ID="${WEB_GTM_ID:-GTM-WJWFZW62}"

echo "==> Creating ${SGTM_DIR}"
mkdir -p "${SGTM_DIR}"
cp "${REPO_ROOT}/infra/sgtm/docker-compose.yml" "${SGTM_DIR}/docker-compose.yml"

echo "==> Starting sGTM container"
cd "${SGTM_DIR}"
docker compose pull
docker compose up -d

echo "==> Installing Nginx site config"
mkdir -p /etc/nginx/includes /etc/nginx/conf.d
cp "${REPO_ROOT}/infra/nginx/conf.d/security-headers-map.conf" /etc/nginx/conf.d/security-headers-map.conf
cp "${REPO_ROOT}/infra/nginx/includes/security-headers.conf" /etc/nginx/includes/security-headers.conf
cp "${REPO_ROOT}/infra/nginx/sgtm-assets.conf" "/etc/nginx/sites-available/${NGINX_SITE}"
sed -i "s/GTM-WJWFZW62/${WEB_GTM_ID}/g" "/etc/nginx/sites-available/${NGINX_SITE}"
ln -sf "/etc/nginx/sites-available/${NGINX_SITE}" "/etc/nginx/sites-enabled/${NGINX_SITE}"

echo "==> Testing Nginx config"
nginx -t
systemctl reload nginx

echo "==> Requesting SSL certificate (certbot)"
if command -v certbot >/dev/null 2>&1; then
  certbot --nginx -d "${NGINX_SITE}" --non-interactive --agree-tos -m "${CERTBOT_EMAIL:-admin@${NGINX_SITE#assets.}}" || true
else
  echo "certbot not found — install with: apt install certbot python3-certbot-nginx"
fi

echo ""
echo "==> Smoke tests"
echo "Docker health:"
curl -sf "http://127.0.0.1:8080/healthy" && echo " ok" || echo " FAILED (check: docker compose -f ${SGTM_DIR}/docker-compose.yml logs sgtm)"

echo "Public /healthy (after DNS + SSL):"
curl -sfI "https://${NGINX_SITE}/healthy" | head -1 || echo "  not ready yet — DNS or SSL may still be propagating"

echo "Public /moondance:"
curl -sfI "https://${NGINX_SITE}/moondance" | head -1 || echo "  not ready yet"

echo ""
echo "Done. Set on the web app (.env):"
echo "  NEXT_PUBLIC_SGTM_HOST=${NGINX_SITE}"
echo "  NEXT_PUBLIC_GTM_ID=${WEB_GTM_ID}"

# Server-side GTM (sGTM)

Stealth GTM loader on `assets.yourimpactdev.com` so adblockers don't block `gtm.js`.

## Prerequisites

1. **DNS** — Add an `A` record: `assets.yourimpactdev.com` → VPS IP (`72.62.6.143`)
2. **GTM IDs** (from deployment guide):
   - Web container (snippet / nginx `/moondance`): `GTM-TGJBL7R7`
   - Server container (Docker `CONTAINER_CONFIG`): `GTM-5TFSRWNR`

## Server setup (VPS)

SSH into the Hostinger VPS and run from the app directory:

```bash
cd /var/www/charity-donation-platform
git pull
sudo bash scripts/setup-sgtm.sh
```

Or manually:

```bash
sudo mkdir -p /opt/sgtm-server
sudo cp infra/sgtm/docker-compose.yml /opt/sgtm-server/
cd /opt/sgtm-server && sudo docker compose up -d

sudo cp infra/nginx/sgtm-assets.conf /etc/nginx/sites-available/assets.yourimpactdev.com
sudo ln -sf /etc/nginx/sites-available/assets.yourimpactdev.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d assets.yourimpactdev.com
```

## Web app env (production)

Add to the server `.env` and rebuild/restart:

```bash
NEXT_PUBLIC_GTM_ID=GTM-TGJBL7R7
NEXT_PUBLIC_SGTM_HOST=assets.yourimpactdev.com
```

Also set `GTM-TGJBL7R7` in **Admin → CMS → Settings → GTM Container ID** (takes precedence over env).

Then:

```bash
pnpm build && pm2 restart web
```

## Verify

```bash
curl -i https://assets.yourimpactdev.com/healthy    # expect 200 + "ok"
curl -i https://assets.yourimpactdev.com/moondance  # expect 200 + GTM javascript
```

## Troubleshooting

```bash
docker compose -f /opt/sgtm-server/docker-compose.yml logs sgtm
```

If the container loops, re-copy `CONTAINER_CONFIG` from GTM dashboard (Admin → Install server container) with no extra spaces.

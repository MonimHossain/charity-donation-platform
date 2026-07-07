# Hostinger VPS security cleanup checklist

Use this after suspected malware, recurring reinfection (~every 2 days), or before redeploying hardened code.

**Target environment (from project deploy history):**

| Item | Value |
|------|--------|
| Provider | Hostinger VPS |
| App path | `/var/www/charity-donation-platform` or `/home/deployment/production/your-impact` |
| Process manager | PM2 (often under `jenkins` user) |
| Reverse proxy | nginx (`infra/nginx/production.conf`) |
| Docker services | PostgreSQL, Redis, MinIO (`infra/docker-compose.yaml`) |
| Domain | `yourimpactdev.com` |
| Current VPS IP | `72.62.6.143` (DNS A record; old `82.29.190.206` is decommissioned) |

Run commands as `root` unless noted. Take snapshots/backups before destructive steps.

---

## XMRig miner — confirmed infection (Hostinger scan)

Hostinger flagged crypto-miner files under the web app directory. **These are not in git** — they were dropped on the server (common causes: unpatched Next.js RCE, weak admin/SSH passwords, or a reinfecting cron job).

**Known paths (remove all of these):**

```
/var/www/charity-donation-platform/apps/web/xmrig-6.21.0/
/var/www/charity-donation-platform/apps/web/scanner_linux
```

`scanner_linux` is part of the same automated attack: it scans the internet for vulnerable servers (including **Next.js RCE**) and downloads XMRig 6.21.0. If it reappears without you creating it, **persistence is still active** on the VPS.

### Step 1 — Stop the miner and remove files

```bash
ssh root@72.62.6.143

# Kill any running xmrig process
sudo pkill -9 xmrig 2>/dev/null || true
sudo pkill -9 scanner_linux 2>/dev/null || true
ps aux | grep -iE 'xmrig|scanner_linux|miner|kinsing|kdevtmpfsi' | grep -v grep

# Remove miner/scanner files
sudo rm -rf /var/www/charity-donation-platform/apps/web/xmrig-6.21.0
sudo rm -f /var/www/charity-donation-platform/apps/web/scanner_linux
sudo find /var/www /tmp /var/tmp /dev/shm /root /home -iname '*xmrig*' -o -iname 'scanner_linux' 2>/dev/null | xargs -r ls -la
sudo find /var/www /tmp /var/tmp -type f -perm -111 -mtime -30 -ls 2>/dev/null | head -50
```

### Step 2 — Find what re-downloads it (check before reboot)

```bash
# Cron (most common — "every 2 days" pattern)
for u in root jenkins www-data deployment; do
  echo "=== $u ==="
  crontab -l -u "$u" 2>/dev/null || true
done
grep -rE 'xmrig|curl.*\|.*sh|wget.*\|.*bash|/tmp/' /etc/cron* /var/spool/cron 2>/dev/null

# systemd persistence
systemctl list-units --type=service --state=running | grep -iE 'xmr|miner|unknown'
ls -la /etc/systemd/system/*.service /etc/systemd/system/multi-user.target.wants/ 2>/dev/null

# PM2 — rogue apps
sudo -u jenkins pm2 list
sudo -u jenkins pm2 save --force

# What is listening / high CPU
ps aux --sort=-%cpu | head -15
```

Delete any cron line, systemd unit, or PM2 process you did not create.

### Step 3 — Rotate all secrets (assume compromised)

```bash
cd /var/www/charity-donation-platform
# Generate new secrets locally, then edit .env on server:
nano .env
cp .env apps/api/.env
```

Rotate: `DB_PASSWORD`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`, `USER_JWT_SECRET`, `MINIO_*`, `STRIPE_*`, `SMTP_PASS`, and **all SSH keys** (GitHub Actions `SSH_PRIVATE_KEY` too).

Set in production `.env`:

```env
DB_SYNCHRONIZE=false
STRIPE_WEBHOOK_SKIP_VERIFY=false
NODE_ENV=production
```

### Step 4 — Redeploy clean code and restart

```bash
cd /var/www/charity-donation-platform
git pull origin prod
pnpm install --frozen-lockfile
pnpm build
sudo -u jenkins pm2 restart all
sudo -u jenkins pm2 save
```

### Step 5 — Re-scan

Ask Hostinger to run another malware scan. Locally verify:

```bash
test ! -e /var/www/charity-donation-platform/apps/web/xmrig-6.21.0 && echo "xmrig folder gone"
ps aux | grep -i xmrig | grep -v grep || echo "no xmrig process"
```

If xmrig returns within 48 hours, a **cron or backdoor user** was missed — use hPanel Browser Terminal and repeat Step 2, or request a **clean VPS reinstall** from Hostinger and restore only the database from backup.

---

## Phase 1 — Stop active compromise

```bash
# 1. List high-CPU processes (common miner sign)
ps aux --sort=-%cpu | head -25

# 2. Unknown node/python/bash in /tmp?
sudo ls -la /tmp /var/tmp /dev/shm 2>/dev/null
sudo find /tmp /var/tmp /dev/shm -type f -mtime -7 -ls 2>/dev/null

# 3. Kill suspicious PIDs (replace PID)
# sudo kill -9 <PID>

# 4. PM2 apps
sudo -u jenkins pm2 list
sudo -u jenkins pm2 logs --lines 100
# Remove unknown PM2 apps:
# sudo -u jenkins pm2 delete <name>
```

---

## Phase 2 — Cron & persistence (reinfection every ~2 days)

Malware often reinstalls via cron.

```bash
# All user crontabs
for u in root jenkins deployment www-data; do
  echo "=== crontab $u ==="
  sudo crontab -l -u "$u" 2>/dev/null || true
done

# System cron
sudo ls -la /etc/cron.d/ /etc/cron.hourly/ /etc/cron.daily/ /etc/cron.weekly/
sudo grep -rE 'curl|wget|/tmp/|base64|xmr|miner|\.sh' /etc/cron* /var/spool/cron 2>/dev/null

# systemd timers
systemctl list-timers --all

# Startup hooks
sudo ls -la /etc/rc.local /etc/profile.d/ ~/.bashrc /root/.bashrc 2>/dev/null
```

**Action:** Delete any cron entry or timer you did not create. Note the script path and inspect it before deleting.

---

## Phase 3 — SSH & access

```bash
# Authorized keys — every line must be yours
sudo cat /root/.ssh/authorized_keys
sudo cat /home/jenkins/.ssh/authorized_keys 2>/dev/null
sudo cat /home/deployment/.ssh/authorized_keys 2>/dev/null

# Recent SSH logins
sudo grep "Accepted" /var/log/auth.log 2>/dev/null | tail -30
# or on some systems:
sudo journalctl -u ssh --since "7 days ago" | grep Accepted

# Open ports
sudo ss -tlnp
```

**Actions:**

- Remove unknown SSH public keys.
- Disable password SSH login; use keys only (`PasswordAuthentication no` in `sshd_config`).
- Restrict SSH to your IP in Hostinger firewall if possible.
- Rotate SSH keys and update GitHub Actions `SSH_PRIVATE_KEY` secret.

---

## Phase 4 — Rotate all secrets (defaults were in git history)

Old deploy scripts used weak defaults. **Assume they are compromised.**

Generate new values and update `.env` on the server (not committed to git):

```bash
cd /var/www/charity-donation-platform   # or your app path
nano .env
cp .env apps/api/.env
```

| Variable | Action |
|----------|--------|
| `DB_PASSWORD` | New strong password; update Postgres + `.env` |
| `ADMIN_PASSWORD` | New strong password (admin panel) |
| `ADMIN_JWT_SECRET` | `openssl rand -hex 32` |
| `USER_JWT_SECRET` | `openssl rand -hex 32` |
| `ADMIN_RESET_SECRET` | `openssl rand -hex 32` |
| `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | New keys; update MinIO + `.env` |
| `STRIPE_*` | Rotate in Stripe Dashboard if exposed |
| `SMTP_PASS` | Rotate if exposed |

**Production flags (required):**

```env
NODE_ENV=production
DB_SYNCHRONIZE=false
STRIPE_WEBHOOK_SKIP_VERIFY=false
STRIPE_WEBHOOK_SECRET=whsec_<real value from Stripe Dashboard>
EMAIL_ENABLED=true
```

Change admin password in DB after updating `ADMIN_PASSWORD` and restarting API (seed only updates if hash mismatch).

---

## Phase 5 — Docker & MinIO

```bash
cd /var/www/charity-donation-platform
docker compose -f infra/docker-compose.yaml ps
docker compose -f infra/docker-compose.yaml logs --tail=50
```

- Do **not** expose MinIO port `9002` publicly; nginx should proxy `/charity-media/` only.
- In Hostinger firewall: allow `80`, `443`; block public access to `54322`, `63793`, `9002`, `4000`, `3001` from the internet.

```bash
# UFW example (adjust if using Hostinger panel firewall)
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Phase 6 — Redeploy hardened application

From your **local machine** (after pulling security patches):

```bash
git pull origin prod
pnpm install --frozen-lockfile
pnpm build
```

On server (GitHub Actions deploy or manual):

```bash
cd /var/www/charity-donation-platform
git pull origin prod
pnpm install --frozen-lockfile
pnpm build
sudo -u jenkins pm2 restart all
sudo -u jenkins pm2 save
```

Verify:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4000/health
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3001
curl -sI http://yourimpactdev.com | head -5
curl -sI https://yourimpactdev.com | head -5   # if this times out, fix SSL on port 443
```

**SSH:** use the current IP, not a retired one:

```bash
ssh root@72.62.6.143
```

---

## HTTPS not working (port 443 timeout)

If `http://yourimpactdev.com` works but `https://` times out, nginx is likely only listening on port 80.
The repo config `infra/nginx/production.conf` is HTTP-only until SSL is provisioned.

On the server (`ssh root@72.62.6.143`):

```bash
sudo ss -tlnp | grep -E ':80|:443'    # expect :80 only until SSL is set up
sudo ufw allow 443/tcp
sudo certbot --nginx -d yourimpactdev.com -d www.yourimpactdev.com
sudo nginx -t && sudo systemctl reload nginx
```

Also open port **443** in Hostinger hPanel → VPS → Firewall.

---

```bash
sudo nginx -t
sudo systemctl status nginx
sudo cat /etc/nginx/sites-enabled/*
```

Ensure only your site config is enabled; compare with `infra/nginx/production.conf`. Reload after changes:

```bash
sudo systemctl reload nginx
```

---

## Phase 8 — Post-cleanup monitoring (48–72 hours)

```bash
# Watch cron again after 2 days
sudo crontab -l -u root
sudo crontab -l -u jenkins

# CPU spikes
top -b -n1 | head -20

# Failed admin logins (if logged)
sudo grep -i "login" /var/log/nginx/access.log | tail -20
```

Enable Hostinger monitoring/alerts for CPU and outbound traffic if available.

---

## What this repo patch fixes (deploy these changes)

| Fix | Detail |
|-----|--------|
| Next.js | Upgraded to ≥15.5.18 (critical RCE advisories) |
| sanitize-html | ≥2.17.4 (XSS advisory) |
| nodemailer | ≥7.0.11 (DoS advisory) |
| Media uploads | Server-side MIME, extension, and magic-byte validation |
| Auth rate limit | 10 req/min on `/admin/login`, `/auth/login`, register, password reset |

---

## If malware returns after cleanup

1. Re-check cron and `/tmp` — persistence was missed.
2. Scan for second SSH key or backdoor user: `cat /etc/passwd | grep -v nologin`.
3. Consider full VPS rebuild from Hostinger panel + restore only DB/media from known-good backup.
4. Review GitHub repo access and rotate `SSH_PRIVATE_KEY` / `SSH_HOST` deploy secrets.

---

## Support contacts

- **Hostinger:** VPS panel → Support (request malware scan / clean reinstall).
- **Stripe:** Dashboard → Developers → Roll keys if `sk_` / `whsec_` were ever committed.
- **Domain/DNS:** Confirm no unauthorized DNS A/CNAME records pointing elsewhere.

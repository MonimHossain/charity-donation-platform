# Server-Side GTM Deployment Guide (Ubuntu + Nginx)

Here's the setup for running a single-container sGTM deployment on a VPS that's already hosting other apps (like Next.js) behind Nginx. We're using a custom Nginx route (`/moondance`) to proxy the GTM script so adblockers don't block it.

## 1. Point your DNS
Before doing anything else, make sure your custom subdomain (e.g., `assets.clientdomain.com`) has an `A` record pointing to the IP address of this VPS. You need this done so the frontend snippet works properly and so we can generate the SSL cert later.

## 2. Update the Frontend Snippet
Once your domain is pointing to the server, swap out the default GTM script on the website with this one. 

Key changes to note:
- The `src` points to our custom path (`/moondance`) on your new subdomain.
- I stripped out the `?id=GTM-TGJBL7R7` part from the snippet. Nginx will inject it server-side so it stays hidden from adblockers.
- Leave the `event:'gtm.js'` part exactly as-is. Changing it will break GTM's internal triggers. Adblockers only care about the network request anyway.

```javascript
<!-- Stealth GTM Snippet -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s);j.async=true;
j.src='https://assets.clientdomain.com/moondance'; 
f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-TGJBL7R7');</script>
<!-- End GTM Snippet -->
```

## 3. Server Setup

### Create Directory
```bash
sudo mkdir -p /opt/sgtm-server && cd /opt/sgtm-server
```

### Docker Compose File
Create a `docker-compose.yml` file:
```yaml
services:
  sgtm:
    image: gcr.io/cloud-tagging-10302018/gtm-cloud-image:stable
    container_name: sgtm_core
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      # Swap this out with the actual config string from the GTM dashboard
      - CONTAINER_CONFIG=aWQ9R1RNLTVURlNSV05SJmVudj0xJmF1dGg9b2VoRGFTSFU5b3l5akI1T3VnT1NNdw==
    restart: always
```

Start it up:
```bash
docker compose up -d
```

### Nginx Config
Create the site config at `/etc/nginx/sites-available/assets.clientdomain.com`:

```nginx
server {
    listen 80;
    server_name assets.clientdomain.com;

    # Need this so Nginx can resolve googletagmanager.com
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    # 1. Custom script loader bypass
    location = /moondance {
        # Remember to replace GTM-TGJBL7R7 below
        rewrite ^ /gtm.js?id=GTM-TGJBL7R7 break;
        proxy_pass https://www.googletagmanager.com;
        proxy_set_header Host www.googletagmanager.com;
        proxy_ssl_server_name on;
    }

    # 2. Main sGTM routing
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
```

Enable it and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/assets.clientdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Setup
Use certbot to get an SSL cert:
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d assets.clientdomain.com
```

## 4. How to Test It

After SSL is set up, run these tests to make sure routing is working.

**Check the Docker Container:**
Run this from your terminal or open it in a browser:
```bash
curl -i https://assets.clientdomain.com/healthy
```
If it's working, it should return an HTTP 200 containing the word `ok`.

**Check the custom loader:**
Make sure Nginx is successfully grabbing the GTM script:
```bash
curl -i https://assets.clientdomain.com/moondance
```
This should return an HTTP 200 and spit out the actual GTM javascript code.

---

## Troubleshooting

### CSP Violations in Next.js
If you're seeing Content Security Policy blocks in the browser console, Next.js is probably restricting where scripts can load from.
**Fix:** Update `next.config.js` or your middleware to whitelist the tracking subdomain:
```javascript
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://assets.clientdomain.com;
  connect-src 'self' https://assets.clientdomain.com;
`;
```

### Container fails to start or `/healthy` isn't working
Check the logs:
```bash
docker compose logs sgtm
```
If the container is looping or crashing, 99% of the time it's because the `CONTAINER_CONFIG` string is messed up. Make sure the Base64 string exactly matches the dashboard and doesn't have any random spaces or line breaks copied into it.

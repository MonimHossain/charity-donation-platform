#!/bin/bash
set -euo pipefail

APP_ROOT="/home/deployment/production/your-impact"
cd "$APP_ROOT"

echo "==> Verifying synced build artifacts"
test -f apps/api/dist/index.js
test -f apps/web/.next/BUILD_ID

echo "==> Writing production env"
cat > .env <<'ENVEOF'
APP_URL=http://82.29.190.206
NEXT_PUBLIC_APP_URL=http://82.29.190.206
NEXT_PUBLIC_API_URL=http://82.29.190.206/api/v1
BACKEND_API_URL=http://127.0.0.1:4000/api/v1
NODE_ENV=production
PORT=4000
DB_HOST=127.0.0.1
DB_PORT=54322
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_DATABASE=charity_platform
DB_SYNCHRONIZE=true
DB_LOGGING=false
REDIS_PORT=63793
ADMIN_EMAIL=admin@charityplatform.org
ADMIN_FULL_NAME=Platform Admin
ADMIN_PASSWORD=Admin123!
ADMIN_JWT_SECRET=charity-platform-jwt-secret-change-me
ADMIN_JWT_EXPIRES_IN=7d
ADMIN_COOKIE_MAX_AGE_MS=604800000
ADMIN_RESET_SECRET=charity-reset-secret-change-me
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM_NAME=Charity Platform
SMTP_FROM_EMAIL=noreply@charityplatform.org
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9002
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_MEDIA=charity-media
MINIO_BUCKET_NAME=charity-media
MINIO_PRESIGNED_EXPIRY=3600
MINIO_PUBLIC_BASE_URL=http://82.29.190.206/charity-media
STRIPE_SECRET_KEY=sk_test_51TZlHBIH7vsFqc41LmrFjasd2Ab3TI5YQV2KbB3GTmnZHhaVRLohT6BDuBGC1lURS2E2Eqqn3n9HW4fk1UiHHAyI00RQJMwGBz
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_WEBHOOK_SKIP_VERIFY=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TZlHBIH7vsFqc41OqgNQk81CnXr0qj5GgOIys8jibXr88T13GhU7o4lNuJ1hoNUH9j222c76EezZXvN3vLz2iw60034bhZGcd
SEED_DATA=true
ENVEOF

cp .env apps/api/.env

cat > apps/web/.env.local <<'WEBEOF'
NEXT_PUBLIC_API_URL=http://82.29.190.206/api/v1
NEXT_PUBLIC_APP_URL=http://82.29.190.206
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51TZlHBIH7vsFqc41OqgNQk81CnXr0qj5GgOIys8jibXr88T13GhU7o4lNuJ1hoNUH9j222c76EezZXvN3vLz2iw60034bhZGcd
PORT=3001
WEBEOF

echo "==> Starting docker services"
docker compose -f infra/docker-compose.yaml up -d

echo "==> Installing dependencies"
pnpm install --frozen-lockfile

echo "==> Restarting pm2 (jenkins user — this is what nginx serves)"
pm2 delete all 2>/dev/null || true
sudo -u jenkins bash -lc "cd '$APP_ROOT' && pm2 restart all || (pm2 start bun dist/index.js --name your-impact-api-prod --cwd '$APP_ROOT/apps/api' && PORT=3001 pm2 start 'pnpm --filter frontend start' --name your-impact-web-prod --cwd '$APP_ROOT')"
sudo -u jenkins pm2 save

echo "==> Health checks"
curl -s -o /dev/null -w "api:%{http_code}\n" http://127.0.0.1:4000/api/v1/health || echo "api:fail"
curl -s -o /dev/null -w "web:%{http_code}\n" http://127.0.0.1:3001 || echo "web:fail"
pm2 status

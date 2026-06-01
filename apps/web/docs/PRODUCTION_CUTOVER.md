# Production cutover checklist

Run after staging UAT passes ([STAGING.md](./STAGING.md)).

## Database

1. Set `DB_SYNCHRONIZE=false` in production API env.
2. Run TypeORM migrations (or export schema from staging) before first deploy.
3. Seed only if starting empty: campaigns with slugs used in marketing (`gaza-emergency-relief`, etc.).

## Application env

| Service | Key settings |
|---------|----------------|
| API | `EMAIL_ENABLED=true`, production Stripe/PayPal, SMTP with SPF/DKIM |
| Web | `NEXT_PUBLIC_USE_MOCK_DATA=false`, production API URL |
| Stripe | Live webhook → `https://api.example.com/api/v1/payments/stripe/webhook` |
| GTM | `gtmId` in admin CMS site settings or `NEXT_PUBLIC_GTM_ID` |

## Smoke test on production

Repeat the 10 steps in STAGING.md using a small real or test-mode charge as policy allows.

## Rollback

- Revert deploy; keep `NEXT_PUBLIC_USE_MOCK_DATA=false` only if API is healthy.
- Payments are idempotent via `completeDonation`; verify Stripe dashboard if webhooks were missed.

## Local development

Keep `NEXT_PUBLIC_USE_MOCK_DATA=true` on developer machines so UI work does not require full stack.

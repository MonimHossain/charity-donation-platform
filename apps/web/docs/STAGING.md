# Staging & MVP smoke tests

Use this checklist when `NEXT_PUBLIC_USE_MOCK_DATA=false` on staging.

## Environment

### API (`apps/api/.env`)

| Variable | Notes |
|----------|--------|
| `DB_*` | PostgreSQL from Docker |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Test mode |
| `PAYPAL_*` | Sandbox |
| `SMTP_*` | Transactional mailbox |
| `EMAIL_ENABLED` | `true` on staging only |
| `MINIO_*` | Media uploads |
| `REDIS_PORT` | For future jobs |
| `NEXT_PUBLIC_APP_URL` / `APP_URL` | Staging web URL (HTTPS for webhooks) |

### Web (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://your-api.example.com/api/v1
NEXT_PUBLIC_APP_URL=https://your-web.example.com
NEXT_PUBLIC_USE_MOCK_DATA=false
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=...
# Optional override if GTM not yet in admin CMS:
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

### Stripe webhooks (local)

```bash
stripe listen --forward-to localhost:4000/api/v1/payments/stripe/webhook
```

## Smoke tests

1. Guest donate £10 to a published campaign — Stripe test card `4242…` — status `completed` in admin.
2. PayPal sandbox one-time donation.
3. Monthly subscription — pause — resume — cancel (Stripe dashboard matches DB).
4. Campaign progress increments once (retry webhook — no double count).
5. Gift Aid + dedication saved on donation row.
6. User register → login → history shows donation.
7. Charity: submit apply-for-review; verify certificate by ID.
8. Homepage hero/testimonials load from API.
9. GTM Preview: `donation_complete` event on thank-you page.
10. Receipt email received when `EMAIL_ENABLED=true`.

## Production cutover

- Set `DB_SYNCHRONIZE=false` and run migrations before go-live.
- Keep `NEXT_PUBLIC_USE_MOCK_DATA=true` only on local dev machines.

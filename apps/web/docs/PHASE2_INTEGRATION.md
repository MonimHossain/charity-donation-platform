# Phase 2 — Page-by-page API integration

When `NEXT_PUBLIC_USE_MOCK_DATA` is not `true`, pages should use real API hooks instead of `lib/mock` and `lib/stores`.

## Per-page checklist

1. **Contract** — Document endpoints in `apps/api` (or add route + entity + migration).
2. **Types** — Align `@repo/shared-types` with API responses.
3. **Data hook** — Add `lib/data/<feature>.ts` with React Query calling `lib/api.ts`.
4. **UI states** — Loading, empty, error on the page.
5. **Business rules** — Gift Aid, Zakat, payments, GDPR copy, admin roles.
6. **Disable mock** — Remove mock imports for that route only.

## Suggested order

- [x] 1. `/donate` + Stripe/PayPal + webhooks
- [x] 2. `/campaigns`, `/campaigns/[slug]`, appeal landings
- [x] 3. Home CMS (`/cms/*`)
- [x] 4. `/blog`
- [x] 5. User auth + `/account/*` + recurring
- [x] 6. Admin: campaigns, donations, users
- [x] 7. Admin: donation-page builder (API at `/admin/donation-pages`)
- [x] 8. Charities, certifications, verify, concerns, applications
- [x] 9. Newsletter, contact, analytics (newsletter + contact wired; `NEXT_PUBLIC_USE_MOCK_DATA=false`)

## Env

```bash
# Phase 1 (default for local UI work)
NEXT_PUBLIC_USE_MOCK_DATA=true

# Phase 2 (per feature as wired)
NEXT_PUBLIC_USE_MOCK_DATA=false
```

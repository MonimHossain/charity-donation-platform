# Post-MVP backlog

Items intentionally deferred from the MVP launch to reduce risk. See [apps/web/docs/STAGING.md](apps/web/docs/STAGING.md) for what is in scope today.

## Donor experience

- Full multi-language UI driven by admin translation CMS
- Site-wide currency selector (beyond `/donate`)
- Zakat split payments across multiple campaigns
- Automated daily-split giving (public wizard + Redis job worker)
- Abandoned donation recovery (email/SMS)
- PDF receipt generation
- PayPal subscription pause/update via API

## CMS & content

- Dynamic homepage section order from `/admin/cms/sections`
- Drag-and-drop visual campaign page builder
- Public routes for `/donation-pages/[slug]`
- Popup targeting rules and A/B tests
- `sitemap.xml` generation and redirect engine (beyond admin stubs)

## Security & compliance

- Admin TOTP 2FA (enroll + verify at login)
- Automated database/media backups
- GDPR: cookie banner, data export, right to erasure workflows
- Field-level encryption for sensitive PII

## Operations

- CDN and image/video transcoding pipeline
- Formal performance budget (&lt;2s LCP) and monitoring (Sentry)
- HMRC Gift Aid export/reporting pack
- Fraud/chargeback playbooks

## Analytics

- Deep donor behaviour/session analytics (beyond admin aggregates + GTM)

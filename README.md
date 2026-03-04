# Embrace Jester Storefront

React + Vite storefront with a local API for:

1. Catalog sync from Printify
2. Checkout + Stripe
3. Newsletter
4. Verified review pipeline + moderation
5. Conversion QA reporting

## Quick Start

Install:

```bash
npm i
```

Run storefront:

```bash
npm run dev -- --host 0.0.0.0 --port 3030
```

Run API:

```bash
npm run server
```

## Core Commands

Catalog sync:

```bash
npm run fetch:products
```

Design automation:

```bash
npm run design:validate -- design_jobs/example.job.json
npm run design:job -- design_jobs/example.job.json
npm run design:batch -- design_jobs/approved
```

Quality checks:

```bash
npm run test
npm run build
```

Stripe local webhook testing:

```bash
npm run server
npm run stripe:listen
npm run stripe:test-payment-intent
```

## Docs

1. Launch and operations: `docs/launch-runbook.md`
2. Printify design automation setup: `docs/printify-design-system.md`

## Required Environment

At minimum:

```bash
PRINTIFY_TOKEN=...
PRINTIFY_SHOP_ID=...
VITE_PRINTIFY_API_BASE=http://localhost:3031
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=... # for local webhook verification
VITE_STRIPE_PUBLISHABLE_KEY=...
```

Optional Stripe debugging:

```bash
STRIPE_WEBHOOK_EVENTS_CACHE_LIMIT=5000
STRIPE_WEBHOOK_LOG_LIMIT=1000
STRIPE_WEBHOOK_DEAD_LETTER_LIMIT=500
STRIPE_WEBHOOK_RETRY_MAX_ATTEMPTS=3
STRIPE_WEBHOOK_RETRY_BASE_MS=250
STRIPE_WEBHOOK_RETRY_MAX_MS=3000
```

Admin-protected pages (`/qa/reviews`, `/qa/conversion`, `/qa/stripe-webhooks`) require:

```bash
ADMIN_API_TOKEN=...
VITE_ADMIN_API_TOKEN=...
```

Keep admin pages disabled in production unless explicitly needed:

```bash
VITE_ENABLE_ADMIN_ROUTES=false
```

Fulfillment retry worker (recommended defaults):

```bash
PRINTIFY_MAX_FULFILLMENT_ATTEMPTS=5
PRINTIFY_RETRY_BASE_MS=30000
PRINTIFY_RETRY_MAX_MS=900000
PRINTIFY_RETRY_SWEEP_MS=60000
DISABLE_PRINTIFY_RETRY_WORKER=false
```

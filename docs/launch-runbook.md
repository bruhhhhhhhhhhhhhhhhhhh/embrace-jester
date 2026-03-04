# Launch Runbook

This runbook is for day-to-day operation before and during ad launch.

## 1. Start Services

Terminal A (storefront):

```bash
npm run dev -- --host 0.0.0.0 --port 3030
```

Terminal B (API):

```bash
npm run server
```

Terminal C (Stripe webhook forwarder, local):

```bash
npm run stripe:listen
```

## 2. Inventory Sync

Pull latest products from Printify:

```bash
npm run fetch:products
```

Validate:

1. `inventory.json` updated timestamp
2. `public/inventory.json` updated timestamp
3. `/shop` and `/product/:id` reflect new variants

## 3. Review Pipeline Ops

Customer flow:

1. Review request links use `/review?token=...`
2. Customer submits review via `/api/reviews/submit`
3. Review appears as `pending`

Admin moderation:

1. Open `/qa/reviews`
2. Publish/reject each pending review
3. Published reviews surface in storefront sections

## 4. Conversion QA Ops

Check conversion funnel dashboard:

1. Open `/qa/conversion`
2. Review:
   - Hero CTR
   - PDP add-to-cart rate
   - Checkout completion rate (mobile vs desktop)
3. Adjust pages before scaling ads

## 5. Required Env

Core:

```bash
VITE_PRINTIFY_API_BASE=http://localhost:3031
PRINTIFY_TOKEN=...
PRINTIFY_SHOP_ID=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
VITE_STRIPE_PUBLISHABLE_KEY=...
```

Optional Stripe webhook controls:

```bash
STRIPE_WEBHOOK_EVENTS_CACHE_LIMIT=5000
STRIPE_WEBHOOK_LOG_LIMIT=1000
STRIPE_WEBHOOK_DEAD_LETTER_LIMIT=500
STRIPE_WEBHOOK_RETRY_MAX_ATTEMPTS=3
STRIPE_WEBHOOK_RETRY_BASE_MS=250
STRIPE_WEBHOOK_RETRY_MAX_MS=3000
```

Optional admin gate:

```bash
ADMIN_API_TOKEN=...
VITE_ADMIN_API_TOKEN=...
VITE_ENABLE_ADMIN_ROUTES=false
```

Optional newsletter/reviews emails (Resend):

```bash
RESEND_API_KEY=...
NEWSLETTER_FROM_EMAIL=...
REVIEW_FROM_EMAIL=...
```

Fulfillment retry worker:

```bash
PRINTIFY_MAX_FULFILLMENT_ATTEMPTS=5
PRINTIFY_RETRY_BASE_MS=30000
PRINTIFY_RETRY_MAX_MS=900000
PRINTIFY_RETRY_SWEEP_MS=60000
DISABLE_PRINTIFY_RETRY_WORKER=false
```

Manual retry sweep (admin only):

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_API_TOKEN" \
  http://localhost:3031/api/printify/retry-sweep
```

## 6. Pre-Ad Checklist

1. At least a few real published reviews.
2. `/qa/conversion` shows non-zero hero impressions/clicks and working funnel tracking.
3. Product pages have accurate shipping/returns copy.
4. Checkout test order succeeds end-to-end.
5. Social links point to real profiles and include UTM tags.
6. No customer-facing references to internal systems.

## 7. Rollback Plan

If new inventory/designs break UX:

1. Restore previous `public/inventory.json`.
2. Restart storefront dev server.
3. Pause new ads until funnel is stable.

If API issue:

1. Restart API (`npm run server`).
2. Check `server/*.json` stores for malformed JSON.

## 8. Stripe Debugging

Trigger a local PaymentIntent + webhook flow:

```bash
npm run stripe:test-payment-intent
```

Inspect Stripe webhook event processing (admin token required if configured):

```bash
curl -H "x-admin-token: $ADMIN_API_TOKEN" \
  "http://localhost:3031/api/stripe/webhook-events?limit=50"
```

Use the QA dashboard for event logs, dead-letter retries, and subscription ops:

1. Open `/qa/stripe-webhooks`
2. Retry due dead letters first, then retry all only when needed
3. Use the subscription panel to create/fetch/manage test subscriptions

Manual dead-letter replay via API:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_API_TOKEN" \
  -d '{"force":true,"limit":20}' \
  "http://localhost:3031/api/stripe/webhook-dead-letter/retry"
```

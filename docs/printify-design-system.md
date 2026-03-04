# Printify Design Automation (OpenClaw Agent)

This document sets up a human-in-the-loop pipeline where OpenClaw handles repetitive work, and you keep final creative and legal control.

## 1. Prerequisites

1. Printify API token and shop ID.
2. Node dependencies installed (`npm i`).
3. Environment file in repo root: `.env.local`.

Required env vars:

```bash
PRINTIFY_TOKEN=your_printify_api_token
PRINTIFY_SHOP_ID=your_shop_id
```

Optional:

```bash
PRINTIFY_PRODUCT_QUERY=
```

## 2. Template Product Strategy

Create one Printify template product per garment type:

1. Tee template
2. Hoodie template
3. Other blanks as needed

Each template should already have:

1. Correct variant set (sizes/colors enabled)
2. Correct print area alignment
3. Correct pricing baseline
4. Correct shipping profile

The pipeline clones from these templates and swaps artwork layers.

## 3. Job File Format

Create design job JSON files (example: `design_jobs/example.job.json`).

Fields:

1. `title`: product title for the new draft product
2. `description`: optional description override
3. `tags`: optional Printify tags
4. `templateProductId`: source template product id
5. `assetPath`: local artwork file path
6. `replacePositions`: usually `["front"]` or `["front","back"]`
7. `visible`: product visibility in Printify
8. `publish`: whether to call Printify publish endpoint
9. `keepEnabledVariantsOnly`: keep only currently enabled template variants
10. `forceEnableAllVariants`: force `is_enabled=true` in created product

## 4. Commands

Validate a job:

```bash
npm run design:validate -- design_jobs/example.job.json
```

Run one job:

```bash
npm run design:job -- design_jobs/example.job.json
```

Run a directory batch:

```bash
npm run design:batch -- design_jobs/approved
```

## 5. What the Script Does

Script: `scripts/printify_design_pipeline.ts`

For each job it:

1. Reads and validates job JSON.
2. Uploads artwork to Printify uploads API.
3. Fetches template product.
4. Clones template into new product payload.
5. Replaces configured print area image layers with uploaded asset.
6. Creates new product as draft.
7. Optionally tries publish.
8. Appends run result to `design_jobs/manifest.json`.

## 6. Human Review Gate (Recommended)

Use this workflow:

1. OpenClaw generates/updates artwork files in `public/designs/`.
2. OpenClaw writes jobs into `design_jobs/pending/`.
3. You review visuals and job metadata.
4. Move approved jobs to `design_jobs/approved/`.
5. Run `npm run design:batch -- design_jobs/approved`.

## 7. Sync Storefront Inventory

After creating products in Printify, refresh local inventory:

```bash
npm run fetch:products
```

This updates:

1. `inventory.json`
2. `public/inventory.json`

## 8. Safety Controls

Keep these manual:

1. Final legal/IP check
2. Final publish decision
3. Variant/pricing sanity check

Do not auto-publish every generated design until rejection rate is low and QA is stable.


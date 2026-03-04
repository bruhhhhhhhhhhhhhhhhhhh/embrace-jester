import http from "http";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import Stripe from "stripe";

const REPO_ROOT = path.resolve(process.cwd());
const ENV_PATHS = [".env.local", ".env"];
const ORDER_STORE_PATH = path.join(REPO_ROOT, "server", "order-store.json");
const NEWSLETTER_STORE_PATH = path.join(REPO_ROOT, "server", "newsletter-store.json");
const SOCIAL_STORE_PATH = path.join(REPO_ROOT, "server", "social-store.json");
const REVIEW_STORE_PATH = path.join(REPO_ROOT, "server", "review-store.json");
const ANALYTICS_STORE_PATH = path.join(REPO_ROOT, "server", "analytics-store.json");
const ALLOWED_ORIGINS = new Set([
  "http://localhost:3030",
  "http://127.0.0.1:3030",
  "http://[::1]:3030",
]);

type PrintifyLineItem = { productId: string; variantId: number; quantity: number };

type StoredOrder = {
  order: {
    id: string;
    createdAt: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      image?: string;
      quantity: number;
      size?: string;
      color?: string;
    }>;
    subtotal: number;
    shippingCost: number;
    tax: number;
    total: number;
    paymentMethod: string;
    shippingMethod: string;
    contact: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    shipping: {
      address: string;
      city: string;
      region: string;
      postal: string;
      country: string;
    };
    estimatedDelivery?: string;
  };
  printify?: {
    lineItems: PrintifyLineItem[];
    addressTo: Record<string, string>;
    shippingMethod?: string;
  };
  status: "pending" | "paid" | "failed";
  stripe: {
    sessionId?: string;
    paymentIntentId?: string;
    paymentStatus?: string | null;
  };
  printifyResult?: {
    orderId?: string;
    status?: "idle" | "submitting" | "submitted" | "failed";
    attempts?: number;
    lastAttemptAt?: string;
    nextRetryAt?: string;
    lastResponseCode?: number;
    error?: string;
  };
};

type StripeWebhookLogStatus = "processed" | "ignored" | "duplicate" | "failed";

type StripeWebhookLogEntry = {
  eventId: string;
  eventType: string;
  receivedAt: string;
  processedAt?: string;
  status: StripeWebhookLogStatus;
  handled: boolean;
  processed: boolean;
  duplicate: boolean;
  note?: string;
  requestId?: string;
  orderId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceId?: string;
};

type StripeBillingCustomerState = {
  id: string;
  email?: string;
  name?: string;
  delinquent?: boolean;
  defaultPaymentMethodId?: string;
  updatedAt: string;
};

type StripeBillingSubscriptionState = {
  id: string;
  customerId?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
  cancelAt?: string | null;
  canceledAt?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  latestInvoiceId?: string;
  latestInvoiceStatus?: string | null;
  updatedAt: string;
};

type StripeBillingInvoiceState = {
  id: string;
  customerId?: string;
  subscriptionId?: string;
  status?: string | null;
  paid: boolean;
  amountDue: number;
  amountPaid: number;
  currency?: string;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
  updatedAt: string;
};

type StripeBillingState = {
  customers: Record<string, StripeBillingCustomerState>;
  subscriptions: Record<string, StripeBillingSubscriptionState>;
  invoices: Record<string, StripeBillingInvoiceState>;
};

type StripeWebhookDeadLetterEntry = {
  eventId: string;
  eventType: string;
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
  nextRetryAt: string;
  lastError: string;
  requestId?: string;
  orderId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceId?: string;
};

type OrderStore = {
  orders: Record<string, StoredOrder>;
  stripeEvents?: Record<string, string>;
  stripeWebhookLog?: StripeWebhookLogEntry[];
  stripeBilling?: StripeBillingState;
  stripeWebhookDeadLetters?: StripeWebhookDeadLetterEntry[];
};

type ShippingCacheValue = {
  expiresAt: number;
  data: Record<string, number>;
};

type NewsletterSubscriber = {
  email: string;
  source: string;
  subscribedAt: string;
  status: "subscribed" | "unsubscribed";
};

type NewsletterCampaign = {
  id: string;
  subject: string;
  headline: string;
  body: string;
  ctaUrl?: string;
  sentAt: string;
  recipients: number;
  provider: "resend" | "dry_run";
  errors: string[];
};

type NewsletterStore = {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
};

type ReviewRequestItem = {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
};

type ReviewRequest = {
  id: string;
  token: string;
  orderId: string;
  email: string;
  firstName?: string;
  createdAt: string;
  expiresAt: string;
  emailedAt?: string;
  emailStatus: "pending" | "sent" | "dry_run" | "failed";
  emailError?: string;
  items: ReviewRequestItem[];
};

type StoredReview = {
  id: string;
  requestId: string;
  requestToken: string;
  orderId: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  status: "pending" | "published" | "rejected";
  moderatedAt?: string;
  moderatedBy?: string;
  publishedAt?: string;
  rejectedReason?: string;
};

type ReviewStore = {
  requests: ReviewRequest[];
  reviews: StoredReview[];
  updatedAt: string;
};

type ConversionEventName =
  | "hero_impression"
  | "hero_cta_click"
  | "pdp_view"
  | "pdp_add_to_cart"
  | "checkout_started"
  | "checkout_completed";

type ConversionEvent = {
  id: string;
  event: ConversionEventName;
  timestamp: string;
  path: string;
  device: "mobile" | "desktop";
  sessionId?: string;
  productId?: string;
  orderId?: string;
};

type AnalyticsStore = {
  events: ConversionEvent[];
  updatedAt: string;
};

type SocialPlatformMetrics = {
  impressions: number;
  views: number;
  clicks: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

type SocialPost = {
  id: string;
  title: string;
  caption: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledFor: string | null;
  publishedAt: string | null;
  assetUrl: string;
  voiceoverPrompt: string;
  source: "native" | "pipeline_manager";
  pipelineRef: string | null;
  metricsByPlatform: Record<string, SocialPlatformMetrics>;
  createdAt: string;
  updatedAt: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  handle: string;
  status: "connected" | "needs_auth" | "error";
  followers: number;
  profileUrl: string;
  lastSyncAt: string | null;
};

type SocialAutomationConfig = {
  scriptProvider: "manual" | "scribe";
  videoProvider: "manual" | "sora" | "veo3";
  audioProvider: "manual" | "lipsync";
  autoPublish: boolean;
  defaultHashtags: string[];
};

type SocialStore = {
  accounts: SocialAccount[];
  posts: SocialPost[];
  automation: SocialAutomationConfig;
  updatedAt: string;
};

type AggregatedSocialMetrics = {
  summary: SocialPlatformMetrics & { engagementRate: number; ctr: number };
  platforms: Array<{
    platform: string;
    metrics: SocialPlatformMetrics & { engagementRate: number; ctr: number };
  }>;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
};

const shippingCache = new Map<string, ShippingCacheValue>();

async function loadEnvFile() {
  for (const filename of ENV_PATHS) {
    const fullPath = path.join(REPO_ROOT, filename);
    try {
      const raw = await fs.readFile(fullPath, "utf-8");
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .forEach((line) => {
          const [key, ...rest] = line.split("=");
          const value = rest.join("=").replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        });
      return;
    } catch {
      // ignore missing env files
    }
  }
}

await loadEnvFile();

const CONFIG = {
  port: Number(process.env.PRINTIFY_SERVER_PORT ?? 3031),
  requestTimeoutMs: Number(process.env.API_REQUEST_TIMEOUT_MS ?? 15000),
  shippingCacheTtlMs: Number(process.env.SHIPPING_CACHE_TTL_MS ?? 300000),
  stripeKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeClientBase: process.env.STRIPE_CLIENT_BASE_URL ?? "http://localhost:3030",
  stripeCurrency: (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase(),
  printifyToken: process.env.PRINTIFY_TOKEN,
  printifyShopId: process.env.PRINTIFY_SHOP_ID,
  printifyMaxFulfillmentAttempts: Number(process.env.PRINTIFY_MAX_FULFILLMENT_ATTEMPTS ?? 5),
  printifyRetryBaseMs: Number(process.env.PRINTIFY_RETRY_BASE_MS ?? 30000),
  printifyRetryMaxMs: Number(process.env.PRINTIFY_RETRY_MAX_MS ?? 900000),
  printifyRetrySweepMs: Number(process.env.PRINTIFY_RETRY_SWEEP_MS ?? 60000),
  disablePrintifyRetryWorker: process.env.DISABLE_PRINTIFY_RETRY_WORKER === "true",
  stripeWebhookEventsCacheLimit: Number(process.env.STRIPE_WEBHOOK_EVENTS_CACHE_LIMIT ?? 5000),
  stripeWebhookLogLimit: Number(process.env.STRIPE_WEBHOOK_LOG_LIMIT ?? 1000),
  stripeWebhookDeadLetterLimit: Number(process.env.STRIPE_WEBHOOK_DEAD_LETTER_LIMIT ?? 500),
  stripeWebhookRetryMaxAttempts: Number(process.env.STRIPE_WEBHOOK_RETRY_MAX_ATTEMPTS ?? 3),
  stripeWebhookRetryBaseMs: Number(process.env.STRIPE_WEBHOOK_RETRY_BASE_MS ?? 250),
  stripeWebhookRetryMaxMs: Number(process.env.STRIPE_WEBHOOK_RETRY_MAX_MS ?? 3000),
  resendApiKey: process.env.RESEND_API_KEY,
  newsletterFromEmail: process.env.NEWSLETTER_FROM_EMAIL ?? "",
  newsletterReplyTo: process.env.NEWSLETTER_REPLY_TO ?? "",
  reviewFromEmail:
    process.env.REVIEW_FROM_EMAIL ?? process.env.NEWSLETTER_FROM_EMAIL ?? "",
  reviewRequestExpiryDays: Number(process.env.REVIEW_REQUEST_EXPIRY_DAYS ?? 90),
  adminApiToken: process.env.ADMIN_API_TOKEN ?? "",
  pipelineManagerBaseUrl: process.env.PIPELINE_MANAGER_ORCHESTRATOR_URL ?? "",
  pipelineManagerExportPath: process.env.PIPELINE_MANAGER_EXPORT_PATH ?? "",
};

const stripeClient = CONFIG.stripeKey ? new Stripe(CONFIG.stripeKey) : null;
const fulfillmentInFlight = new Set<string>();

const sendJson = (
  res: http.ServerResponse,
  status: number,
  payload: unknown,
  origin?: string
) => {
  res.statusCode = status;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Stripe-Signature");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
};

const hasValidAdminToken = (req: http.IncomingMessage) => {
  if (!CONFIG.adminApiToken) return true;
  const token = req.headers["x-admin-token"];
  if (Array.isArray(token)) {
    return token.includes(CONFIG.adminApiToken);
  }
  return token === CONFIG.adminApiToken;
};

const readBodyBuffer = async (req: http.IncomingMessage) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const readJson = async (req: http.IncomingMessage) => {
  const raw = await readBodyBuffer(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf-8"));
  } catch {
    throw new Error("Invalid JSON body");
  }
};

const buildLineItems = (items: PrintifyLineItem[]) =>
  items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
  }));

const shippingMethodCode = (method: string) => {
  switch (method) {
    case "express":
      return 2;
    case "printify_express":
      return 3;
    case "economy":
      return 4;
    case "priority":
      return 2;
    case "standard":
    default:
      return 1;
  }
};

const toCents = (amount: number) => Math.max(0, Math.round(amount * 100));

const defaultStripeBillingState = (): StripeBillingState => ({
  customers: {},
  subscriptions: {},
  invoices: {},
});

const defaultOrderStore = (): OrderStore => ({
  orders: {},
  stripeEvents: {},
  stripeWebhookLog: [],
  stripeBilling: defaultStripeBillingState(),
  stripeWebhookDeadLetters: [],
});

const readOrderStore = async (): Promise<OrderStore> => {
  try {
    const raw = await fs.readFile(ORDER_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as OrderStore;
    if (!parsed || typeof parsed !== "object") {
      return defaultOrderStore();
    }

    const stripeBilling = parsed.stripeBilling;

    return {
      orders:
        parsed.orders && typeof parsed.orders === "object" ? parsed.orders : {},
      stripeEvents:
        parsed.stripeEvents && typeof parsed.stripeEvents === "object"
          ? parsed.stripeEvents
          : {},
      stripeWebhookLog: Array.isArray(parsed.stripeWebhookLog) ? parsed.stripeWebhookLog : [],
      stripeBilling:
        stripeBilling && typeof stripeBilling === "object"
          ? {
              customers:
                stripeBilling.customers && typeof stripeBilling.customers === "object"
                  ? stripeBilling.customers
                  : {},
              subscriptions:
                stripeBilling.subscriptions && typeof stripeBilling.subscriptions === "object"
                  ? stripeBilling.subscriptions
                  : {},
              invoices:
                stripeBilling.invoices && typeof stripeBilling.invoices === "object"
                  ? stripeBilling.invoices
                  : {},
            }
          : defaultStripeBillingState(),
      stripeWebhookDeadLetters: Array.isArray(parsed.stripeWebhookDeadLetters)
        ? parsed.stripeWebhookDeadLetters
        : [],
    };
  } catch {
    return defaultOrderStore();
  }
};

const writeOrderStore = async (store: OrderStore) => {
  await fs.mkdir(path.dirname(ORDER_STORE_PATH), { recursive: true });
  await fs.writeFile(ORDER_STORE_PATH, JSON.stringify(store, null, 2));
};

const nowIso = () => new Date().toISOString();
const unixToIso = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) && value > 0
    ? new Date(value * 1000).toISOString()
    : null;
const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const createId = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const defaultNewsletterStore = (): NewsletterStore => ({
  subscribers: [],
  campaigns: [],
});

const readNewsletterStore = async (): Promise<NewsletterStore> => {
  try {
    const raw = await fs.readFile(NEWSLETTER_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as NewsletterStore;
    if (!parsed || typeof parsed !== "object") return defaultNewsletterStore();
    return {
      subscribers: Array.isArray(parsed.subscribers) ? parsed.subscribers : [],
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
    };
  } catch {
    return defaultNewsletterStore();
  }
};

const writeNewsletterStore = async (store: NewsletterStore) => {
  await fs.mkdir(path.dirname(NEWSLETTER_STORE_PATH), { recursive: true });
  await fs.writeFile(NEWSLETTER_STORE_PATH, JSON.stringify(store, null, 2));
};

const defaultReviewStore = (): ReviewStore => ({
  requests: [],
  reviews: [],
  updatedAt: nowIso(),
});

const readReviewStore = async (): Promise<ReviewStore> => {
  try {
    const raw = await fs.readFile(REVIEW_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as ReviewStore;
    if (!parsed || typeof parsed !== "object") return defaultReviewStore();
    return {
      requests: Array.isArray(parsed.requests) ? parsed.requests : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return defaultReviewStore();
  }
};

const writeReviewStore = async (store: ReviewStore) => {
  await fs.mkdir(path.dirname(REVIEW_STORE_PATH), { recursive: true });
  await fs.writeFile(REVIEW_STORE_PATH, JSON.stringify(store, null, 2));
};

const CONVERSION_EVENTS: ConversionEventName[] = [
  "hero_impression",
  "hero_cta_click",
  "pdp_view",
  "pdp_add_to_cart",
  "checkout_started",
  "checkout_completed",
];
const CONVERSION_EVENT_SET = new Set<ConversionEventName>(CONVERSION_EVENTS);
const MAX_ANALYTICS_EVENTS = 5000;

const defaultAnalyticsStore = (): AnalyticsStore => ({
  events: [],
  updatedAt: nowIso(),
});

const readAnalyticsStore = async (): Promise<AnalyticsStore> => {
  try {
    const raw = await fs.readFile(ANALYTICS_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as AnalyticsStore;
    if (!parsed || typeof parsed !== "object") return defaultAnalyticsStore();
    return {
      events: Array.isArray(parsed.events) ? parsed.events : [],
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return defaultAnalyticsStore();
  }
};

const writeAnalyticsStore = async (store: AnalyticsStore) => {
  await fs.mkdir(path.dirname(ANALYTICS_STORE_PATH), { recursive: true });
  await fs.writeFile(ANALYTICS_STORE_PATH, JSON.stringify(store, null, 2));
};

const normalizeReviewItems = (order: StoredOrder["order"]): ReviewRequestItem[] => {
  const map = new Map<string, ReviewRequestItem>();
  order.items.forEach((item) => {
    const existing = map.get(item.id);
    if (existing) {
      existing.quantity += item.quantity;
      if (!existing.size && item.size) existing.size = item.size;
      if (!existing.color && item.color) existing.color = item.color;
      if (!existing.image && item.image) existing.image = item.image;
      return;
    }
    map.set(item.id, {
      productId: item.id,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    });
  });
  return Array.from(map.values());
};

const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  const hiddenLength = Math.max(1, name.length - visible.length);
  return `${visible}${"*".repeat(hiddenLength)}@${domain}`;
};

const buildReviewRequestHtml = ({
  firstName,
  reviewUrl,
  orderId,
  items,
}: {
  firstName?: string;
  reviewUrl: string;
  orderId: string;
  items: ReviewRequestItem[];
}) => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0f1116;color:#f2f2f2;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#151922;border:1px solid #2a3140;border-radius:12px;">
      <tr><td style="padding:24px;">
        <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8ea0bf;margin:0 0 8px;">Looksmax Verified Buyer Review</p>
        <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#ffffff;">${firstName ? `Thanks, ${firstName}` : "Thanks for your order"} — leave your review</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d3d9e6;">Order ${orderId} was delivered. Verified buyer reviews help other customers judge fit and quality before they buy.</p>
        <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#c0cade;">Items: ${items
          .map((item) => `${item.name}${item.quantity > 1 ? ` x${item.quantity}` : ""}`)
          .join(" • ")}</p>
        <p style="margin:0 0 20px;"><a href="${reviewUrl}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#3d6be0;color:#fff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;">Leave Verified Review</a></p>
        <p style="margin:0;font-size:12px;color:#8ea0bf;">Your review enters moderation before publishing.</p>
      </td></tr>
    </table>
  </body>
</html>`;

const sendReviewRequestEmail = async (
  request: ReviewRequest
): Promise<{ status: ReviewRequest["emailStatus"]; error?: string }> => {
  if (!CONFIG.reviewFromEmail || !CONFIG.resendApiKey) {
    return { status: "dry_run" };
  }

  const reviewUrl = `${CONFIG.stripeClientBase}/review?token=${encodeURIComponent(request.token)}`;
  const html = buildReviewRequestHtml({
    firstName: request.firstName,
    reviewUrl,
    orderId: request.orderId,
    items: request.items,
  });
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: CONFIG.reviewFromEmail,
      to: [request.email],
      subject: "How did your LOOKSMAX order fit?",
      html,
      reply_to: CONFIG.newsletterReplyTo || undefined,
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    return { status: "failed", error: text || `http_${response.status}` };
  }
  return { status: "sent" };
};

const ensureReviewRequestForOrder = async (order: StoredOrder["order"]) => {
  const email = (order.contact.email ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) return null;

  const store = await readReviewStore();
  const existing = store.requests.find(
    (entry) => entry.orderId === order.id && entry.email === email
  );
  if (existing) return existing;

  const items = normalizeReviewItems(order);
  if (!items.length) return null;

  const createdAt = nowIso();
  const expiryMs = Math.max(1, CONFIG.reviewRequestExpiryDays) * 24 * 60 * 60 * 1000;
  const request: ReviewRequest = {
    id: createId("review_req"),
    token: crypto.randomBytes(24).toString("hex"),
    orderId: order.id,
    email,
    firstName: order.contact.firstName,
    createdAt,
    expiresAt: new Date(Date.now() + expiryMs).toISOString(),
    emailStatus: "pending",
    items,
  };
  store.requests.push(request);

  let result: { status: ReviewRequest["emailStatus"]; error?: string };
  try {
    result = await sendReviewRequestEmail(request);
  } catch (error) {
    result = { status: "failed", error: (error as Error).message };
  }
  request.emailStatus = result.status;
  request.emailedAt = nowIso();
  request.emailError = result.error;
  store.updatedAt = nowIso();
  await writeReviewStore(store);
  return request;
};

const defaultSocialStore = (): SocialStore => ({
  accounts: [
    {
      id: createId("acct"),
      platform: "instagram",
      handle: "@looksmax.store",
      status: "needs_auth",
      followers: 0,
      profileUrl: "",
      lastSyncAt: null,
    },
    {
      id: createId("acct"),
      platform: "tiktok",
      handle: "@looksmax.store",
      status: "needs_auth",
      followers: 0,
      profileUrl: "",
      lastSyncAt: null,
    },
    {
      id: createId("acct"),
      platform: "youtube_shorts",
      handle: "@looksmaxstore",
      status: "needs_auth",
      followers: 0,
      profileUrl: "",
      lastSyncAt: null,
    },
  ],
  posts: [],
  automation: {
    scriptProvider: "manual",
    videoProvider: "manual",
    audioProvider: "manual",
    autoPublish: false,
    defaultHashtags: ["#looksmax", "#streetwear", "#merchdrop"],
  },
  updatedAt: nowIso(),
});

const readSocialStore = async (): Promise<SocialStore> => {
  try {
    const raw = await fs.readFile(SOCIAL_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as SocialStore;
    if (!parsed || typeof parsed !== "object") return defaultSocialStore();
    return {
      accounts: Array.isArray(parsed.accounts) ? parsed.accounts : [],
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      automation: parsed.automation ?? defaultSocialStore().automation,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
    };
  } catch {
    return defaultSocialStore();
  }
};

const writeSocialStore = async (store: SocialStore) => {
  await fs.mkdir(path.dirname(SOCIAL_STORE_PATH), { recursive: true });
  await fs.writeFile(SOCIAL_STORE_PATH, JSON.stringify(store, null, 2));
};

const normalizePlatform = (platform: string) =>
  platform.trim().toLowerCase().replace(/\s+/g, "_");

const normalizePlatformList = (input: unknown): string[] => {
  if (!Array.isArray(input)) return [];
  const normalized = input
    .filter((value): value is string => typeof value === "string")
    .map(normalizePlatform)
    .filter(Boolean);
  return Array.from(new Set(normalized));
};

const emptyPlatformMetrics = (): SocialPlatformMetrics => ({
  impressions: 0,
  views: 0,
  clicks: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
});

const randomMetricsForPlatform = (): SocialPlatformMetrics => {
  const impressions = Math.floor(4500 + Math.random() * 24000);
  const views = Math.floor(impressions * (0.23 + Math.random() * 0.34));
  const clicks = Math.floor(impressions * (0.008 + Math.random() * 0.025));
  const likes = Math.floor(views * (0.05 + Math.random() * 0.14));
  const comments = Math.floor(views * (0.005 + Math.random() * 0.02));
  const shares = Math.floor(views * (0.004 + Math.random() * 0.018));
  const saves = Math.floor(views * (0.003 + Math.random() * 0.012));
  return { impressions, views, clicks, likes, comments, shares, saves };
};

const aggregateSocialMetrics = (store: SocialStore): AggregatedSocialMetrics => {
  const perPlatform = new Map<string, SocialPlatformMetrics>();
  const publishedPosts = store.posts.filter((post) => post.status === "published");

  for (const post of publishedPosts) {
    for (const [platform, metrics] of Object.entries(post.metricsByPlatform ?? {})) {
      const current = perPlatform.get(platform) ?? emptyPlatformMetrics();
      perPlatform.set(platform, {
        impressions: current.impressions + Number(metrics.impressions || 0),
        views: current.views + Number(metrics.views || 0),
        clicks: current.clicks + Number(metrics.clicks || 0),
        likes: current.likes + Number(metrics.likes || 0),
        comments: current.comments + Number(metrics.comments || 0),
        shares: current.shares + Number(metrics.shares || 0),
        saves: current.saves + Number(metrics.saves || 0),
      });
    }
  }

  const platforms = Array.from(perPlatform.entries()).map(([platform, metrics]) => {
    const engagementBase = metrics.impressions || 1;
    const engagementRate =
      (metrics.likes + metrics.comments + metrics.shares + metrics.saves) / engagementBase;
    const ctr = metrics.clicks / engagementBase;
    return {
      platform,
      metrics: {
        ...metrics,
        engagementRate: Number(engagementRate.toFixed(4)),
        ctr: Number(ctr.toFixed(4)),
      },
    };
  });

  const summaryBase = platforms.reduce(
    (acc, item) => {
      acc.impressions += item.metrics.impressions;
      acc.views += item.metrics.views;
      acc.clicks += item.metrics.clicks;
      acc.likes += item.metrics.likes;
      acc.comments += item.metrics.comments;
      acc.shares += item.metrics.shares;
      acc.saves += item.metrics.saves;
      return acc;
    },
    emptyPlatformMetrics()
  );

  const summaryDenominator = summaryBase.impressions || 1;
  return {
    summary: {
      ...summaryBase,
      engagementRate: Number(
        (
          (summaryBase.likes + summaryBase.comments + summaryBase.shares + summaryBase.saves) /
          summaryDenominator
        ).toFixed(4)
      ),
      ctr: Number((summaryBase.clicks / summaryDenominator).toFixed(4)),
    },
    platforms: platforms.sort((a, b) => b.metrics.impressions - a.metrics.impressions),
    publishedPosts: publishedPosts.length,
    scheduledPosts: store.posts.filter((post) => post.status === "scheduled").length,
    draftPosts: store.posts.filter((post) => post.status === "draft").length,
  };
};

const toSocialStatus = (value: unknown): SocialPost["status"] => {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";
  if (normalized.includes("publish") || normalized === "completed" || normalized === "success") {
    return "published";
  }
  if (normalized.includes("sched") || normalized === "queued" || normalized === "running") {
    return "scheduled";
  }
  if (normalized.includes("fail") || normalized.includes("error") || normalized === "blocked") {
    return "failed";
  }
  return "draft";
};

const mapPipelineItemToSocialPost = (item: Record<string, unknown>): SocialPost | null => {
  const pipelineRef =
    (typeof item.workflowRunId === "string" && item.workflowRunId) ||
    (typeof item.id === "string" && item.id) ||
    (typeof item.canonicalPostId === "string" && item.canonicalPostId) ||
    null;

  const title =
    (typeof item.title === "string" && item.title.trim()) ||
    (typeof item.canonicalPostId === "string" && item.canonicalPostId.trim()) ||
    (typeof item.workflowRunId === "string" && item.workflowRunId.trim()) ||
    "";
  if (!title) return null;

  const caption =
    (typeof item.caption === "string" && item.caption) ||
    (typeof item.description === "string" && item.description) ||
    (typeof item.lastNote === "string" && item.lastNote) ||
    "";

  const platforms = normalizePlatformList(item.platformTargets ?? item.platforms);
  const status = toSocialStatus(item.status);
  const scheduledFor =
    (typeof item.scheduledFor === "string" && item.scheduledFor) ||
    (typeof item.scheduled_at === "string" && item.scheduled_at) ||
    null;

  const now = nowIso();
  return {
    id: createId("post"),
    title,
    caption,
    platforms: platforms.length ? platforms : ["instagram"],
    status,
    scheduledFor: status === "scheduled" ? scheduledFor || now : null,
    publishedAt: status === "published" ? now : null,
    assetUrl: typeof item.assetUrl === "string" ? item.assetUrl : "",
    voiceoverPrompt: "",
    source: "pipeline_manager",
    pipelineRef,
    metricsByPlatform: {},
    createdAt: now,
    updatedAt: now,
  };
};

const buildNewsletterHtml = ({
  headline,
  body,
  ctaUrl,
  unsubscribeUrl,
}: {
  headline: string;
  body: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}) => `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#0f1116;color:#f2f2f2;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#151922;border:1px solid #2a3140;border-radius:12px;">
      <tr><td style="padding:24px;">
        <p style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8ea0bf;margin:0 0 8px;">Looksmax Drop Alert</p>
        <h1 style="margin:0 0 14px;font-size:26px;line-height:1.2;color:#ffffff;">${headline}</h1>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#d3d9e6;">${body}</p>
        ${
          ctaUrl
            ? `<p style="margin:0 0 18px;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 16px;border-radius:8px;background:#3d6be0;color:#fff;text-decoration:none;font-weight:700;font-size:13px;letter-spacing:.06em;text-transform:uppercase;">Shop Drop</a></p>`
            : ""
        }
        <p style="margin:0;font-size:12px;color:#8ea0bf;">You are receiving this because you subscribed for product drops.</p>
        ${
          unsubscribeUrl
            ? `<p style="margin:10px 0 0;font-size:11px;color:#8ea0bf;">If you no longer want updates, <a href="${unsubscribeUrl}" style="color:#8ea0bf;text-decoration:underline;">unsubscribe here</a>.</p>`
            : ""
        }
      </td></tr>
    </table>
  </body>
</html>`;

const stripeLineItemsFromOrder = (order: StoredOrder["order"]) => {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => {
      const variantLabel = [
        item.size && `Size ${item.size}`,
        item.color && `Color ${item.color}`,
      ]
        .filter(Boolean)
        .join(" · ");
      const images = item.image && item.image.startsWith("http") ? [item.image] : undefined;
      return {
        price_data: {
          currency: CONFIG.stripeCurrency,
          unit_amount: toCents(item.price),
          product_data: {
            name: item.name,
            description: variantLabel || undefined,
            images,
          },
        },
        quantity: item.quantity,
      };
    }
  );

  if (order.shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: CONFIG.stripeCurrency,
        unit_amount: toCents(order.shippingCost),
        product_data: { name: "Shipping" },
      },
      quantity: 1,
    });
  }

  if (order.tax > 0) {
    lineItems.push({
      price_data: {
        currency: CONFIG.stripeCurrency,
        unit_amount: toCents(order.tax),
        product_data: { name: "Estimated tax" },
      },
      quantity: 1,
    });
  }

  return lineItems;
};

const calculateOrderAmountCents = (order: StoredOrder["order"]) => {
  const itemsTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return toCents(itemsTotal + order.shippingCost + order.tax);
};

const isRetryableHttpStatus = (status: number) =>
  status === 408 || status === 409 || status === 425 || status === 429 || status >= 500;

const normalizePrintifyError = (data: unknown) => {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const candidate = data as Record<string, unknown>;
    const errorValue = candidate.error;
    if (typeof errorValue === "string" && errorValue.trim()) return errorValue;
    if (Array.isArray(errorValue) && errorValue.length) {
      return errorValue.map((entry) => String(entry)).join("; ");
    }
    const message = candidate.message;
    if (typeof message === "string" && message.trim()) return message;
    const errors = candidate.errors;
    if (Array.isArray(errors) && errors.length) {
      return errors.map((entry) => String(entry)).join("; ");
    }
  }
  return "Printify order failed";
};

const isRetryableNetworkError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("abort") ||
    normalized.includes("timeout") ||
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("econnreset") ||
    normalized.includes("enotfound")
  );
};

const parseIsoTimeMs = (value?: string) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getRetryDelayMs = (attempts: number) => {
  const base = Math.max(1000, CONFIG.printifyRetryBaseMs);
  const max = Math.max(base, CONFIG.printifyRetryMaxMs);
  const exponent = Math.max(0, attempts - 1);
  return Math.min(max, base * 2 ** exponent);
};

const buildPrintifyExternalId = (orderId: string) => {
  const sanitized = orderId.replace(/[^a-zA-Z0-9_-]/g, "").slice(-48) || "order";
  return `LMX-${sanitized}`;
};

const isOrderPaid = (stored: StoredOrder) =>
  stored.status === "paid" ||
  stored.stripe.paymentStatus === "succeeded" ||
  stored.stripe.paymentStatus === "paid";

const shouldSkipFulfillment = (
  stored: StoredOrder,
  options?: {
    force?: boolean;
  }
) => {
  if (!stored.printify?.lineItems?.length) return true;
  if (stored.printifyResult?.orderId) return true;
  if (
    !options?.force &&
    stored.printifyResult?.status === "failed" &&
    !stored.printifyResult?.nextRetryAt
  ) {
    return true;
  }
  if (stored.printifyResult?.status === "submitting") return true;
  const retryAtMs = parseIsoTimeMs(stored.printifyResult?.nextRetryAt);
  if (retryAtMs && retryAtMs > Date.now()) return true;
  const attempts = stored.printifyResult?.attempts ?? 0;
  if (attempts >= Math.max(1, CONFIG.printifyMaxFulfillmentAttempts)) return true;
  return false;
};

const withFulfillmentLock = async <T>(orderId: string, task: () => Promise<T>) => {
  while (fulfillmentInFlight.has(orderId)) {
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  fulfillmentInFlight.add(orderId);
  try {
    return await task();
  } finally {
    fulfillmentInFlight.delete(orderId);
  }
};

const fulfillPrintifyForOrder = async (
  stored: StoredOrder,
  options?: {
    force?: boolean;
  }
) => {
  if (shouldSkipFulfillment(stored, options)) return;

  await withFulfillmentLock(stored.order.id, async () => {
    if (shouldSkipFulfillment(stored, options)) return;

    const attempts = stored.printifyResult?.attempts ?? 0;
    stored.printifyResult = {
      ...stored.printifyResult,
      status: "submitting",
      attempts: attempts + 1,
      lastAttemptAt: nowIso(),
      nextRetryAt: undefined,
      lastResponseCode: undefined,
      error: undefined,
    };

    try {
      const { response, data } = await createPrintifyOrder({
        lineItems: stored.printify?.lineItems ?? [],
        addressTo: stored.printify?.addressTo ?? {},
        shippingMethod: stored.printify?.shippingMethod,
        externalId: buildPrintifyExternalId(stored.order.id),
      });

      const errorMessage = normalizePrintifyError(data);
      if (response.ok && data?.id) {
        stored.printifyResult = {
          ...stored.printifyResult,
          status: "submitted",
          orderId: String(data.id),
          lastResponseCode: response.status,
          error: undefined,
          nextRetryAt: undefined,
        };
        return;
      }

      const nextAttemptCount = stored.printifyResult?.attempts ?? attempts + 1;
      const retryable = isRetryableHttpStatus(response.status);
      const shouldRetry = retryable && nextAttemptCount < Math.max(1, CONFIG.printifyMaxFulfillmentAttempts);
      stored.printifyResult = {
        ...stored.printifyResult,
        status: "failed",
        lastResponseCode: response.status,
        error: errorMessage,
        nextRetryAt: shouldRetry
          ? new Date(Date.now() + getRetryDelayMs(nextAttemptCount)).toISOString()
          : undefined,
      };
    } catch (error) {
      const message = (error as Error).message || "Printify order failed";
      const nextAttemptCount = stored.printifyResult?.attempts ?? attempts + 1;
      const retryable = isRetryableNetworkError(message);
      const shouldRetry = retryable && nextAttemptCount < Math.max(1, CONFIG.printifyMaxFulfillmentAttempts);
      stored.printifyResult = {
        ...stored.printifyResult,
        status: "failed",
        error: message,
        nextRetryAt: shouldRetry
          ? new Date(Date.now() + getRetryDelayMs(nextAttemptCount)).toISOString()
          : undefined,
      };
    }
  });
};

const trimStripeWebhookEventCache = (events: Record<string, string>) => {
  const entries = Object.entries(events);
  const maxEntries = Math.max(100, CONFIG.stripeWebhookEventsCacheLimit);
  if (entries.length <= maxEntries) return events;
  entries.sort((a, b) => Date.parse(a[1]) - Date.parse(b[1]));
  const keep = entries.slice(entries.length - maxEntries);
  return Object.fromEntries(keep);
};

const markStripeWebhookProcessed = (store: OrderStore, eventId: string) => {
  store.stripeEvents = store.stripeEvents ?? {};
  store.stripeEvents[eventId] = nowIso();
  store.stripeEvents = trimStripeWebhookEventCache(store.stripeEvents);
};

const trimStripeWebhookLog = (entries: StripeWebhookLogEntry[]) => {
  const maxEntries = Math.max(100, CONFIG.stripeWebhookLogLimit);
  if (entries.length <= maxEntries) return entries;
  return entries.slice(entries.length - maxEntries);
};

const appendStripeWebhookLog = (store: OrderStore, entry: StripeWebhookLogEntry) => {
  const next = [...(store.stripeWebhookLog ?? []), entry];
  store.stripeWebhookLog = trimStripeWebhookLog(next);
};

const trimStripeWebhookDeadLetters = (entries: StripeWebhookDeadLetterEntry[]) => {
  const maxEntries = Math.max(50, CONFIG.stripeWebhookDeadLetterLimit);
  if (entries.length <= maxEntries) return entries;
  return entries.slice(entries.length - maxEntries);
};

const getStripeWebhookRetryDelayMs = (attempts: number) => {
  const base = Math.max(100, CONFIG.stripeWebhookRetryBaseMs);
  const max = Math.max(base, CONFIG.stripeWebhookRetryMaxMs);
  const exponent = Math.max(0, attempts - 1);
  return Math.min(max, base * 2 ** exponent);
};

const removeStripeWebhookDeadLetter = (store: OrderStore, eventId: string) => {
  store.stripeWebhookDeadLetters = (store.stripeWebhookDeadLetters ?? []).filter(
    (entry) => entry.eventId !== eventId
  );
};

const bumpStripeWebhookDeadLetterFailure = (
  store: OrderStore,
  args: {
    eventId: string;
    eventType: string;
    error: Error;
    context?: Partial<StripeWebhookLogEntry>;
    requestId?: string;
  }
) => {
  const existing = (store.stripeWebhookDeadLetters ?? []).find((entry) => entry.eventId === args.eventId);
  const attempts = (existing?.attempts ?? 0) + 1;
  const now = nowIso();
  const nextRetryAt = new Date(Date.now() + getStripeWebhookRetryDelayMs(attempts)).toISOString();
  const next: StripeWebhookDeadLetterEntry = {
    eventId: args.eventId,
    eventType: args.eventType,
    attempts,
    firstFailedAt: existing?.firstFailedAt ?? now,
    lastFailedAt: now,
    nextRetryAt,
    lastError: args.error.message || "Unhandled webhook processing error",
    requestId: args.requestId,
    orderId: args.context?.orderId,
    paymentIntentId: args.context?.paymentIntentId,
    sessionId: args.context?.sessionId,
    customerId: args.context?.customerId,
    subscriptionId: args.context?.subscriptionId,
    invoiceId: args.context?.invoiceId,
  };
  const others = (store.stripeWebhookDeadLetters ?? []).filter(
    (entry) => entry.eventId !== args.eventId
  );
  store.stripeWebhookDeadLetters = trimStripeWebhookDeadLetters([...others, next]);
  return next;
};

const upsertStripeWebhookDeadLetter = (
  store: OrderStore,
  args: {
    event: Stripe.Event;
    error: Error;
    context?: Partial<StripeWebhookLogEntry>;
    requestId?: string;
  }
) =>
  bumpStripeWebhookDeadLetterFailure(store, {
    eventId: args.event.id,
    eventType: args.event.type,
    error: args.error,
    context: args.context,
    requestId: args.requestId,
  });

const ensureStripeBillingState = (store: OrderStore): StripeBillingState => {
  store.stripeBilling = store.stripeBilling ?? defaultStripeBillingState();
  store.stripeBilling.customers = store.stripeBilling.customers ?? {};
  store.stripeBilling.subscriptions = store.stripeBilling.subscriptions ?? {};
  store.stripeBilling.invoices = store.stripeBilling.invoices ?? {};
  return store.stripeBilling;
};

const extractStripeId = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;

const fetchJson = async (url: string, init: RequestInit) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.requestTimeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
};

const createPrintifyOrder = async ({
  lineItems,
  addressTo,
  shippingMethod,
  externalId,
  sendShippingNotification = false,
}: {
  lineItems: PrintifyLineItem[];
  addressTo: Record<string, string>;
  shippingMethod?: string;
  externalId?: string;
  sendShippingNotification?: boolean;
}) => {
  if (!CONFIG.printifyToken || !CONFIG.printifyShopId) {
    throw new Error("Missing Printify credentials");
  }

  const method = shippingMethod ?? "standard";
  const payload = {
    external_id: externalId || `LMX-${Date.now()}`,
    line_items: buildLineItems(lineItems),
    shipping_method: shippingMethodCode(method),
    is_printify_express: method === "printify_express",
    is_economy_shipping: method === "economy",
    send_shipping_notification: sendShippingNotification,
    address_to: addressTo,
  };

  return fetchJson(`https://api.printify.com/v1/shops/${CONFIG.printifyShopId}/orders.json`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CONFIG.printifyToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
};

const requestPrintifyShipping = async ({
  lineItems,
  addressTo,
}: {
  lineItems: PrintifyLineItem[];
  addressTo: Record<string, string>;
}) => {
  if (!CONFIG.printifyToken || !CONFIG.printifyShopId) {
    throw new Error("Missing Printify credentials");
  }

  const payload = {
    line_items: buildLineItems(lineItems),
    address_to: addressTo,
  };

  return fetchJson(
    `https://api.printify.com/v1/shops/${CONFIG.printifyShopId}/orders/shipping.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.printifyToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
};

const uniqueOrderRecords = (store: OrderStore) => {
  const seen = new Set<StoredOrder>();
  const records: StoredOrder[] = [];
  Object.values(store.orders).forEach((entry) => {
    if (seen.has(entry)) return;
    seen.add(entry);
    records.push(entry);
  });
  return records;
};

const findStoredOrderByOrderId = (store: OrderStore, orderId: string) =>
  uniqueOrderRecords(store).find((entry) => entry.order.id === orderId) ?? null;

const upsertStoredOrderIndexes = (store: OrderStore, stored: StoredOrder) => {
  if (stored.stripe.sessionId) {
    store.orders[stored.stripe.sessionId] = stored;
  }
  if (stored.stripe.paymentIntentId) {
    store.orders[stored.stripe.paymentIntentId] = stored;
  }
};

const processStripeWebhookEvent = async (
  store: OrderStore,
  event: Stripe.Event
): Promise<{
  didMutate: boolean;
  handledEvent: boolean;
  note?: string;
  context: Partial<StripeWebhookLogEntry>;
}> => {
  let didMutate = false;
  let handledEvent = false;
  let note: string | undefined;
  const context: Partial<StripeWebhookLogEntry> = {};

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    handledEvent = true;
    const session = event.data.object as Stripe.Checkout.Session;
    const metadataOrderId =
      typeof session.metadata?.orderId === "string" ? session.metadata.orderId : undefined;
    context.sessionId = session.id;
    if (typeof session.payment_intent === "string") {
      context.paymentIntentId = session.payment_intent;
    }
    if (metadataOrderId) {
      context.orderId = metadataOrderId;
    }
    const stored =
      store.orders[session.id] ??
      (typeof session.payment_intent === "string" ? store.orders[session.payment_intent] : undefined) ??
      (metadataOrderId ? findStoredOrderByOrderId(store, metadataOrderId) : null);

    if (stored) {
      context.orderId = stored.order.id;
      stored.status = "paid";
      stored.stripe.paymentStatus = session.payment_status ?? stored.stripe.paymentStatus;
      stored.stripe.sessionId = session.id;
      if (typeof session.payment_intent === "string") {
        stored.stripe.paymentIntentId = session.payment_intent;
      }
      upsertStoredOrderIndexes(store, stored);
      await fulfillPrintifyForOrder(stored);
      await ensureReviewRequestForOrder(stored.order);
      didMutate = true;
    } else {
      note = "Checkout session event did not match a stored order";
    }
  }

  if (
    event.type === "payment_intent.succeeded" ||
    event.type === "payment_intent.processing" ||
    event.type === "payment_intent.payment_failed"
  ) {
    handledEvent = true;
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const metadataOrderId =
      typeof paymentIntent.metadata?.orderId === "string" ? paymentIntent.metadata.orderId : undefined;
    context.paymentIntentId = paymentIntent.id;
    if (metadataOrderId) {
      context.orderId = metadataOrderId;
    }
    const stored =
      store.orders[paymentIntent.id] ??
      (metadataOrderId ? findStoredOrderByOrderId(store, metadataOrderId) : null);

    if (stored) {
      context.orderId = stored.order.id;
      stored.stripe.paymentIntentId = paymentIntent.id;
      stored.stripe.paymentStatus = paymentIntent.status;
      upsertStoredOrderIndexes(store, stored);
      if (event.type === "payment_intent.succeeded") {
        stored.status = "paid";
        await fulfillPrintifyForOrder(stored);
        await ensureReviewRequestForOrder(stored.order);
      } else if (event.type === "payment_intent.payment_failed") {
        stored.status = "failed";
      } else {
        stored.status = "pending";
      }
      didMutate = true;
    } else {
      note = "Payment intent event did not match a stored order";
    }
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    handledEvent = true;
    const invoice = event.data.object as Stripe.Invoice;
    const billing = ensureStripeBillingState(store);
    const customerId = extractStripeId(invoice.customer);
    const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;
    const metadataOrderId =
      typeof invoice.metadata?.orderId === "string" ? invoice.metadata.orderId : undefined;
    context.invoiceId = invoice.id;
    context.customerId = customerId;
    context.subscriptionId = subscriptionId;
    if (metadataOrderId) {
      context.orderId = metadataOrderId;
    }

    billing.invoices[invoice.id] = {
      id: invoice.id,
      customerId,
      subscriptionId,
      status: invoice.status,
      paid: Boolean(invoice.paid),
      amountDue: invoice.amount_due ?? 0,
      amountPaid: invoice.amount_paid ?? 0,
      currency: invoice.currency,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      updatedAt: nowIso(),
    };

    if (customerId) {
      const existingCustomer = billing.customers[customerId];
      billing.customers[customerId] = {
        id: customerId,
        email: invoice.customer_email ?? existingCustomer?.email,
        name: invoice.customer_name ?? existingCustomer?.name,
        delinquent: existingCustomer?.delinquent,
        defaultPaymentMethodId: existingCustomer?.defaultPaymentMethodId,
        updatedAt: nowIso(),
      };
    }

    if (subscriptionId) {
      const existingSubscription = billing.subscriptions[subscriptionId];
      billing.subscriptions[subscriptionId] = {
        id: subscriptionId,
        customerId: customerId ?? existingSubscription?.customerId,
        status: existingSubscription?.status,
        cancelAtPeriodEnd: existingSubscription?.cancelAtPeriodEnd,
        cancelAt: existingSubscription?.cancelAt,
        canceledAt: existingSubscription?.canceledAt,
        currentPeriodStart: existingSubscription?.currentPeriodStart,
        currentPeriodEnd: existingSubscription?.currentPeriodEnd,
        latestInvoiceId: invoice.id,
        latestInvoiceStatus: invoice.status,
        updatedAt: nowIso(),
      };
    }

    if (metadataOrderId) {
      const stored = findStoredOrderByOrderId(store, metadataOrderId);
      if (stored) {
        context.orderId = stored.order.id;
        stored.stripe.paymentStatus = invoice.status;
        stored.status = event.type === "invoice.paid" ? "paid" : "failed";
        upsertStoredOrderIndexes(store, stored);
      } else {
        note = "Invoice event contained metadata.orderId but no matching order was found";
      }
    }

    didMutate = true;
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    handledEvent = true;
    const subscription = event.data.object as Stripe.Subscription;
    const billing = ensureStripeBillingState(store);
    const customerId = extractStripeId(subscription.customer);
    const latestInvoiceId = extractStripeId(subscription.latest_invoice);
    const metadataOrderId =
      typeof subscription.metadata?.orderId === "string" ? subscription.metadata.orderId : undefined;
    context.subscriptionId = subscription.id;
    context.customerId = customerId;
    if (metadataOrderId) {
      context.orderId = metadataOrderId;
    }

    const existingSubscription = billing.subscriptions[subscription.id];
    billing.subscriptions[subscription.id] = {
      id: subscription.id,
      customerId,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: unixToIso(subscription.cancel_at),
      canceledAt: unixToIso(subscription.canceled_at),
      currentPeriodStart: unixToIso(subscription.current_period_start),
      currentPeriodEnd: unixToIso(subscription.current_period_end),
      latestInvoiceId,
      latestInvoiceStatus: existingSubscription?.latestInvoiceStatus,
      updatedAt: nowIso(),
    };

    if (customerId) {
      const existingCustomer = billing.customers[customerId];
      billing.customers[customerId] = {
        id: customerId,
        email: existingCustomer?.email,
        name: existingCustomer?.name,
        delinquent: existingCustomer?.delinquent,
        defaultPaymentMethodId: existingCustomer?.defaultPaymentMethodId,
        updatedAt: nowIso(),
      };
    }

    if (metadataOrderId) {
      const stored = findStoredOrderByOrderId(store, metadataOrderId);
      if (stored) {
        context.orderId = stored.order.id;
        if (event.type === "customer.subscription.deleted") {
          stored.status = "failed";
          stored.stripe.paymentStatus = "subscription_canceled";
        } else {
          stored.stripe.paymentStatus = `subscription_${subscription.status}`;
        }
        upsertStoredOrderIndexes(store, stored);
      } else {
        note = "Subscription event contained metadata.orderId but no matching order was found";
      }
    }

    didMutate = true;
  }

  if (!handledEvent) {
    note = `No handler for webhook event type ${event.type}`;
  }

  return { didMutate, handledEvent, note, context };
};

const upsertBillingCustomerSnapshot = (
  store: OrderStore,
  customer: Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) => {
  if (!customer || customer.deleted) return null;
  const billing = ensureStripeBillingState(store);
  const id = customer.id;
  const existing = billing.customers[id];
  billing.customers[id] = {
    id,
    email: customer.email ?? existing?.email,
    name: customer.name ?? existing?.name,
    delinquent: customer.delinquent ?? existing?.delinquent,
    defaultPaymentMethodId:
      (typeof customer.invoice_settings?.default_payment_method === "string"
        ? customer.invoice_settings.default_payment_method
        : existing?.defaultPaymentMethodId) ?? undefined,
    updatedAt: nowIso(),
  };
  return billing.customers[id];
};

const upsertBillingSubscriptionSnapshot = (
  store: OrderStore,
  subscription: Stripe.Subscription | null | undefined
) => {
  if (!subscription) return null;
  const billing = ensureStripeBillingState(store);
  const customerId = extractStripeId(subscription.customer);
  const latestInvoiceId = extractStripeId(subscription.latest_invoice);
  const existing = billing.subscriptions[subscription.id];
  billing.subscriptions[subscription.id] = {
    id: subscription.id,
    customerId,
    status: subscription.status,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    cancelAt: unixToIso(subscription.cancel_at),
    canceledAt: unixToIso(subscription.canceled_at),
    currentPeriodStart: unixToIso(subscription.current_period_start),
    currentPeriodEnd: unixToIso(subscription.current_period_end),
    latestInvoiceId,
    latestInvoiceStatus: existing?.latestInvoiceStatus,
    updatedAt: nowIso(),
  };
  return billing.subscriptions[subscription.id];
};

const upsertBillingInvoiceSnapshot = (
  store: OrderStore,
  invoice: Stripe.Invoice | null | undefined
) => {
  if (!invoice) return null;
  const billing = ensureStripeBillingState(store);
  const customerId = extractStripeId(invoice.customer);
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : undefined;
  billing.invoices[invoice.id] = {
    id: invoice.id,
    customerId,
    subscriptionId,
    status: invoice.status,
    paid: Boolean(invoice.paid),
    amountDue: invoice.amount_due ?? 0,
    amountPaid: invoice.amount_paid ?? 0,
    currency: invoice.currency,
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdf: invoice.invoice_pdf,
    updatedAt: nowIso(),
  };
  return billing.invoices[invoice.id];
};

let printifyRetrySweepInFlight = false;

const runPrintifyRetrySweep = async () => {
  if (printifyRetrySweepInFlight) {
    return { skipped: true, attempted: 0, submitted: 0, failed: 0 };
  }

  printifyRetrySweepInFlight = true;
  try {
    const store = await readOrderStore();
    const orders = uniqueOrderRecords(store);
    let attempted = 0;
    let submitted = 0;
    let failed = 0;

    for (const stored of orders) {
      if (!isOrderPaid(stored)) continue;
      if (stored.printifyResult?.orderId) continue;
      if (shouldSkipFulfillment(stored)) continue;

      attempted += 1;
      await fulfillPrintifyForOrder(stored);
      if (stored.printifyResult?.orderId) {
        submitted += 1;
      } else if (stored.printifyResult?.status === "failed") {
        failed += 1;
      }

      if (stored.stripe.sessionId) {
        store.orders[stored.stripe.sessionId] = stored;
      }
      if (stored.stripe.paymentIntentId) {
        store.orders[stored.stripe.paymentIntentId] = stored;
      }
    }

    if (attempted > 0) {
      await writeOrderStore(store);
    }

    return { skipped: false, attempted, submitted, failed };
  } finally {
    printifyRetrySweepInFlight = false;
  }
};

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {}, origin);
    return;
  }

  if (!req.url) {
    sendJson(res, 404, { error: "Not found" }, origin);
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname;

  try {
    const requiresAdmin =
      pathname.startsWith("/api/social") ||
      pathname === "/api/stripe/webhook-events" ||
      pathname === "/api/stripe/webhook-dead-letter/retry" ||
      pathname === "/api/stripe/subscriptions" ||
      pathname === "/api/stripe/subscriptions/manage" ||
      pathname === "/api/newsletter/subscribers" ||
      pathname === "/api/newsletter/send-drop" ||
      pathname === "/api/reviews/moderation" ||
      pathname === "/api/printify/retry-sweep" ||
      pathname === "/api/analytics/funnel";
    if (requiresAdmin && !hasValidAdminToken(req)) {
      sendJson(res, 401, { error: "Unauthorized" }, origin);
      return;
    }

    const socialScheduleMatch = pathname.match(/^\/api\/social\/posts\/([^/]+)\/schedule$/);
    const socialPublishMatch = pathname.match(/^\/api\/social\/posts\/([^/]+)\/publish$/);

    if (socialScheduleMatch) {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const postId = decodeURIComponent(socialScheduleMatch[1]);
      const body = (await readJson(req)) as { scheduledFor?: string };
      const store = await readSocialStore();
      const target = store.posts.find((post) => post.id === postId);
      if (!target) {
        sendJson(res, 404, { error: "Post not found" }, origin);
        return;
      }
      target.status = "scheduled";
      target.scheduledFor = body.scheduledFor || nowIso();
      target.updatedAt = nowIso();
      store.updatedAt = nowIso();
      await writeSocialStore(store);
      sendJson(res, 200, { ok: true, post: target }, origin);
      return;
    }

    if (socialPublishMatch) {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const postId = decodeURIComponent(socialPublishMatch[1]);
      const store = await readSocialStore();
      const target = store.posts.find((post) => post.id === postId);
      if (!target) {
        sendJson(res, 404, { error: "Post not found" }, origin);
        return;
      }

      if (!target.platforms.length) {
        target.platforms = ["instagram"];
      }
      const metrics: Record<string, SocialPlatformMetrics> = {};
      target.platforms.forEach((platform) => {
        metrics[platform] = randomMetricsForPlatform();
      });
      target.metricsByPlatform = metrics;
      target.status = "published";
      target.publishedAt = nowIso();
      target.scheduledFor = null;
      target.updatedAt = nowIso();
      store.updatedAt = nowIso();
      await writeSocialStore(store);

      sendJson(
        res,
        200,
        { ok: true, post: target, metrics: aggregateSocialMetrics(store) },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/webhook") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      if (!stripeClient || !CONFIG.stripeWebhookSecret) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        sendJson(res, 400, { error: "Missing Stripe-Signature header" }, origin);
        return;
      }

      const rawBody = await readBodyBuffer(req);
      let event: Stripe.Event;
      try {
        event = stripeClient.webhooks.constructEvent(rawBody, signature, CONFIG.stripeWebhookSecret);
      } catch {
        sendJson(res, 400, { error: "Invalid webhook signature" }, origin);
        return;
      }

      const store = await readOrderStore();
      const receivedAt = nowIso();
      const requestIdHeader = req.headers["request-id"];
      const requestId = typeof requestIdHeader === "string" ? requestIdHeader : undefined;

      if (store.stripeEvents?.[event.id]) {
        removeStripeWebhookDeadLetter(store, event.id);
        appendStripeWebhookLog(store, {
          eventId: event.id,
          eventType: event.type,
          receivedAt,
          status: "duplicate",
          handled: true,
          processed: false,
          duplicate: true,
          note: "Event already processed",
          requestId,
        });
        await writeOrderStore(store);
        sendJson(res, 200, { received: true, duplicate: true }, origin);
        return;
      }

      let didMutate = false;
      let handledEvent = false;
      let note: string | undefined;
      let context: Partial<StripeWebhookLogEntry> = {};
      const maxAttempts = Math.max(1, CONFIG.stripeWebhookRetryMaxAttempts);
      let attemptsUsed = 0;
      let processingError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        attemptsUsed = attempt;
        try {
          const result = await processStripeWebhookEvent(store, event);
          didMutate = result.didMutate;
          handledEvent = result.handledEvent;
          note = result.note;
          context = result.context;
          processingError = null;
          break;
        } catch (error) {
          processingError = error as Error;
          if (attempt < maxAttempts) {
            await waitMs(getStripeWebhookRetryDelayMs(attempt));
          }
        }
      }

      if (processingError) {
        const deadLetter = upsertStripeWebhookDeadLetter(store, {
          event,
          error: processingError,
          context,
          requestId,
        });
        appendStripeWebhookLog(store, {
          eventId: event.id,
          eventType: event.type,
          receivedAt,
          processedAt: nowIso(),
          status: "failed",
          handled: handledEvent,
          processed: false,
          duplicate: false,
          note: `${processingError.message} (attempt ${deadLetter.attempts}, next retry ${deadLetter.nextRetryAt})`,
          requestId,
          ...context,
        });
        await writeOrderStore(store);
        throw processingError;
      }

      if (attemptsUsed > 1) {
        note = note
          ? `${note}; recovered after ${attemptsUsed} attempts`
          : `Recovered after ${attemptsUsed} attempts`;
      }

      removeStripeWebhookDeadLetter(store, event.id);
      markStripeWebhookProcessed(store, event.id);
      appendStripeWebhookLog(store, {
        eventId: event.id,
        eventType: event.type,
        receivedAt,
        processedAt: nowIso(),
        status: didMutate ? "processed" : "ignored",
        handled: handledEvent,
        processed: didMutate,
        duplicate: false,
        note,
        requestId,
        ...context,
      });
      await writeOrderStore(store);

      sendJson(
        res,
        200,
        { received: true, processed: didMutate, handled: handledEvent, type: event.type },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/payment-intent") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      if (!stripeClient) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        order?: StoredOrder["order"];
        printify?: StoredOrder["printify"];
      };

      if (!body.order?.items?.length || !body.order.contact?.email) {
        sendJson(res, 400, { error: "Order items and contact email are required" }, origin);
        return;
      }

      const amount = calculateOrderAmountCents(body.order);
      if (!amount) {
        sendJson(res, 400, { error: "Order total must be greater than zero" }, origin);
        return;
      }

      const store = await readOrderStore();
      const existingOrder = findStoredOrderByOrderId(store, body.order.id);
      if (existingOrder?.stripe.paymentIntentId && existingOrder.status !== "failed") {
        try {
          const latestIntent = await stripeClient.paymentIntents.retrieve(
            existingOrder.stripe.paymentIntentId
          );
          existingOrder.stripe.paymentStatus = latestIntent.status;
          if (latestIntent.status === "succeeded") {
            existingOrder.status = "paid";
            await fulfillPrintifyForOrder(existingOrder);
            await ensureReviewRequestForOrder(existingOrder.order);
          } else if (latestIntent.status === "processing") {
            existingOrder.status = "pending";
          } else if (
            latestIntent.status === "requires_payment_method" ||
            latestIntent.status === "canceled"
          ) {
            existingOrder.status = "failed";
          } else {
            existingOrder.status = "pending";
          }

          store.orders[existingOrder.stripe.paymentIntentId] = existingOrder;
          if (existingOrder.stripe.sessionId) {
            store.orders[existingOrder.stripe.sessionId] = existingOrder;
          }
          await writeOrderStore(store);

          if (latestIntent.client_secret) {
            sendJson(
              res,
              200,
              {
                id: latestIntent.id,
                paymentIntentId: latestIntent.id,
                clientSecret: latestIntent.client_secret,
                paymentStatus: latestIntent.status,
                reused: true,
              },
              origin
            );
            return;
          }
        } catch {
          // Fall through and try creating a new intent.
        }
      }

      const paymentIntent = await stripeClient.paymentIntents.create(
        {
          amount,
          currency: CONFIG.stripeCurrency,
          automatic_payment_methods: { enabled: true },
          receipt_email: body.order.contact.email,
          metadata: {
            orderId: body.order.id,
          },
        },
        {
          idempotencyKey: `lmx_pi_${body.order.id}`,
        }
      );

      if (!paymentIntent.client_secret) {
        sendJson(res, 500, { error: "Stripe did not return a client secret" }, origin);
        return;
      }

      const storedOrder: StoredOrder = {
        order: body.order,
        printify: body.printify,
        status: paymentIntent.status === "succeeded" ? "paid" : "pending",
        stripe: {
          sessionId: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          paymentStatus: paymentIntent.status,
        },
      };
      store.orders[paymentIntent.id] = storedOrder;
      if (storedOrder.stripe.sessionId) {
        store.orders[storedOrder.stripe.sessionId] = storedOrder;
      }
      if (storedOrder.stripe.paymentIntentId) {
        store.orders[storedOrder.stripe.paymentIntentId] = storedOrder;
      }
      if (paymentIntent.status === "succeeded") {
        await fulfillPrintifyForOrder(storedOrder);
        await ensureReviewRequestForOrder(storedOrder.order);
      }
      await writeOrderStore(store);

      sendJson(
        res,
        200,
        {
          id: paymentIntent.id,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          paymentStatus: paymentIntent.status,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/checkout") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      if (!stripeClient) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        order?: StoredOrder["order"];
        printify?: StoredOrder["printify"];
      };

      if (!body.order?.items?.length || !body.order.contact?.email) {
        sendJson(res, 400, { error: "Order items and contact email are required" }, origin);
        return;
      }

      const lineItems = stripeLineItemsFromOrder(body.order);
      if (!lineItems.length) {
        sendJson(res, 400, { error: "No line items to charge" }, origin);
        return;
      }

      const store = await readOrderStore();
      const existingOrder = findStoredOrderByOrderId(store, body.order.id);
      if (existingOrder?.stripe.sessionId && existingOrder.status !== "failed") {
        try {
          const existingSession = await stripeClient.checkout.sessions.retrieve(
            existingOrder.stripe.sessionId
          );
          existingOrder.stripe.sessionId = existingSession.id;
          existingOrder.stripe.paymentStatus =
            existingSession.payment_status ?? existingOrder.stripe.paymentStatus;
          if (existingSession.payment_status === "paid") {
            existingOrder.status = "paid";
            await fulfillPrintifyForOrder(existingOrder);
            await ensureReviewRequestForOrder(existingOrder.order);
          }
          store.orders[existingSession.id] = existingOrder;
          if (existingOrder.stripe.paymentIntentId) {
            store.orders[existingOrder.stripe.paymentIntentId] = existingOrder;
          }
          await writeOrderStore(store);
          sendJson(
            res,
            200,
            {
              id: existingSession.id,
              url: existingSession.url,
              paymentStatus: existingSession.payment_status ?? "unpaid",
              reused: true,
            },
            origin
          );
          return;
        } catch {
          // Fall through and create a new Checkout Session.
        }
      }

      const session = await stripeClient.checkout.sessions.create(
        {
          mode: "payment",
          line_items: lineItems,
          success_url: `${CONFIG.stripeClientBase}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${CONFIG.stripeClientBase}/checkout?cancelled=1`,
          customer_email: body.order.contact.email,
          client_reference_id: body.order.id,
          metadata: {
            orderId: body.order.id,
          },
        },
        {
          idempotencyKey: `lmx_cs_${body.order.id}`,
        }
      );

      const storedOrder: StoredOrder = {
        order: body.order,
        printify: body.printify,
        status: "pending",
        stripe: {
          sessionId: session.id,
          paymentIntentId:
            typeof session.payment_intent === "string" ? session.payment_intent : undefined,
          paymentStatus: session.payment_status ?? "unpaid",
        },
      };
      if (storedOrder.stripe.paymentStatus === "paid") {
        storedOrder.status = "paid";
        await fulfillPrintifyForOrder(storedOrder);
        await ensureReviewRequestForOrder(storedOrder.order);
      }
      store.orders[session.id] = storedOrder;
      if (storedOrder.stripe.paymentIntentId) {
        store.orders[storedOrder.stripe.paymentIntentId] = storedOrder;
      }
      await writeOrderStore(store);

      sendJson(
        res,
        200,
        { id: session.id, url: session.url, paymentStatus: session.payment_status ?? "unpaid" },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/order-status") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const sessionId = url.searchParams.get("session_id");
      const paymentIntentId = url.searchParams.get("payment_intent");
      const lookupId = paymentIntentId || sessionId;
      if (!lookupId) {
        sendJson(res, 400, { error: "session_id or payment_intent is required" }, origin);
        return;
      }

      const store = await readOrderStore();
      let stored = store.orders[lookupId];
      if (!stored) {
        stored =
          uniqueOrderRecords(store).find(
            (entry) =>
              entry.stripe.sessionId === lookupId || entry.stripe.paymentIntentId === lookupId
          ) ?? null;
      }
      if (!stored) {
        sendJson(res, 404, { error: "Order not found" }, origin);
        return;
      }

      if (stripeClient && stored.stripe.paymentIntentId) {
        try {
          const latestIntent = await stripeClient.paymentIntents.retrieve(stored.stripe.paymentIntentId);
          stored.stripe.paymentStatus = latestIntent.status;
          if (latestIntent.status === "succeeded") {
            stored.status = "paid";
            await fulfillPrintifyForOrder(stored);
            await ensureReviewRequestForOrder(stored.order);
          } else if (latestIntent.status === "processing") {
            stored.status = "pending";
          } else if (
            latestIntent.status === "requires_payment_method" ||
            latestIntent.status === "canceled"
          ) {
            stored.status = "failed";
          }
          upsertStoredOrderIndexes(store, stored);
          await writeOrderStore(store);
        } catch {
          // keep persisted status if Stripe refresh fails
        }
      }

      sendJson(
        res,
        200,
        {
          status: stored.status,
          paymentStatus: stored.stripe.paymentStatus ?? null,
          paymentIntentId: stored.stripe.paymentIntentId ?? null,
          sessionId: stored.stripe.sessionId ?? null,
          orderId: stored.order.id,
          printifyOrderId: stored.printifyResult?.orderId ?? null,
          printifyStatus: stored.printifyResult?.status ?? null,
          printifyAttempts: stored.printifyResult?.attempts ?? 0,
          printifyNextRetryAt: stored.printifyResult?.nextRetryAt ?? null,
          printifyError: stored.printifyResult?.error ?? null,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/subscriptions") {
      if (!stripeClient) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      if (req.method === "GET") {
        const subscriptionId = url.searchParams.get("id");
        if (!subscriptionId) {
          sendJson(res, 400, { error: "id is required" }, origin);
          return;
        }

        const subscription = await stripeClient.subscriptions.retrieve(subscriptionId, {
          expand: ["latest_invoice.payment_intent", "latest_invoice", "customer"],
        });
        const store = await readOrderStore();
        upsertBillingSubscriptionSnapshot(store, subscription);
        if (typeof subscription.customer === "object") {
          upsertBillingCustomerSnapshot(store, subscription.customer);
        }
        const latestInvoice =
          subscription.latest_invoice && typeof subscription.latest_invoice === "object"
            ? (subscription.latest_invoice as Stripe.Invoice)
            : null;
        if (latestInvoice) {
          upsertBillingInvoiceSnapshot(store, latestInvoice);
          const billing = ensureStripeBillingState(store);
          const target = billing.subscriptions[subscription.id];
          if (target) {
            target.latestInvoiceStatus = latestInvoice.status;
            target.updatedAt = nowIso();
          }
        }
        await writeOrderStore(store);

        const paymentIntent =
          latestInvoice && latestInvoice.payment_intent && typeof latestInvoice.payment_intent === "object"
            ? (latestInvoice.payment_intent as Stripe.PaymentIntent)
            : null;

        sendJson(
          res,
          200,
          {
            ok: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: extractStripeId(subscription.customer),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              cancelAt: unixToIso(subscription.cancel_at),
              canceledAt: unixToIso(subscription.canceled_at),
              currentPeriodStart: unixToIso(subscription.current_period_start),
              currentPeriodEnd: unixToIso(subscription.current_period_end),
            },
            latestInvoice: latestInvoice
              ? {
                  id: latestInvoice.id,
                  status: latestInvoice.status,
                  paid: Boolean(latestInvoice.paid),
                  amountDue: latestInvoice.amount_due ?? 0,
                  amountPaid: latestInvoice.amount_paid ?? 0,
                  currency: latestInvoice.currency,
                }
              : null,
            paymentIntentClientSecret: paymentIntent?.client_secret ?? null,
          },
          origin
        );
        return;
      }

      if (req.method === "POST") {
        const body = (await readJson(req)) as {
          priceId?: string;
          customerId?: string;
          customerEmail?: string;
          customerName?: string;
          paymentMethodId?: string;
          trialPeriodDays?: number;
          quantity?: number;
          metadata?: Record<string, unknown>;
        };

        if (!body.priceId) {
          sendJson(res, 400, { error: "priceId is required" }, origin);
          return;
        }

        const metadata: Record<string, string> = {};
        if (body.metadata && typeof body.metadata === "object") {
          Object.entries(body.metadata).forEach(([key, value]) => {
            if (value === undefined || value === null) return;
            metadata[key] = String(value);
          });
        }

        let customer: Stripe.Customer | Stripe.DeletedCustomer;
        if (body.customerId) {
          customer = await stripeClient.customers.retrieve(body.customerId);
        } else {
          if (!body.customerEmail) {
            sendJson(res, 400, { error: "customerId or customerEmail is required" }, origin);
            return;
          }
          customer = await stripeClient.customers.create({
            email: body.customerEmail,
            name: body.customerName,
            metadata,
          });
        }

        if (customer.deleted) {
          sendJson(res, 400, { error: "Customer is deleted" }, origin);
          return;
        }

        if (body.paymentMethodId) {
          try {
            await stripeClient.paymentMethods.attach(body.paymentMethodId, { customer: customer.id });
          } catch (error) {
            const message = ((error as Error).message || "").toLowerCase();
            if (!message.includes("already attached")) {
              throw error;
            }
          }
          await stripeClient.customers.update(customer.id, {
            invoice_settings: {
              default_payment_method: body.paymentMethodId,
            },
          });
        }

        const quantity = Math.max(1, Number(body.quantity ?? 1) || 1);
        const trialPeriodDays = Number(body.trialPeriodDays);
        const subscription = await stripeClient.subscriptions.create(
          {
            customer: customer.id,
            items: [{ price: body.priceId, quantity }],
            payment_behavior: "default_incomplete",
            payment_settings: body.paymentMethodId
              ? { save_default_payment_method: "on_subscription" }
              : undefined,
            trial_period_days:
              Number.isFinite(trialPeriodDays) && trialPeriodDays > 0
                ? Math.round(trialPeriodDays)
                : undefined,
            metadata,
          },
          {
            expand: ["latest_invoice.payment_intent", "latest_invoice", "customer"],
          }
        );

        const store = await readOrderStore();
        upsertBillingCustomerSnapshot(store, customer);
        upsertBillingSubscriptionSnapshot(store, subscription);
        const latestInvoice =
          subscription.latest_invoice && typeof subscription.latest_invoice === "object"
            ? (subscription.latest_invoice as Stripe.Invoice)
            : null;
        if (latestInvoice) {
          upsertBillingInvoiceSnapshot(store, latestInvoice);
          const billing = ensureStripeBillingState(store);
          const target = billing.subscriptions[subscription.id];
          if (target) {
            target.latestInvoiceStatus = latestInvoice.status;
            target.updatedAt = nowIso();
          }
        }
        await writeOrderStore(store);

        const paymentIntent =
          latestInvoice && latestInvoice.payment_intent && typeof latestInvoice.payment_intent === "object"
            ? (latestInvoice.payment_intent as Stripe.PaymentIntent)
            : null;

        sendJson(
          res,
          200,
          {
            ok: true,
            subscription: {
              id: subscription.id,
              status: subscription.status,
              customerId: customer.id,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              cancelAt: unixToIso(subscription.cancel_at),
              canceledAt: unixToIso(subscription.canceled_at),
              currentPeriodStart: unixToIso(subscription.current_period_start),
              currentPeriodEnd: unixToIso(subscription.current_period_end),
            },
            latestInvoice: latestInvoice
              ? {
                  id: latestInvoice.id,
                  status: latestInvoice.status,
                  paid: Boolean(latestInvoice.paid),
                  amountDue: latestInvoice.amount_due ?? 0,
                  amountPaid: latestInvoice.amount_paid ?? 0,
                  currency: latestInvoice.currency,
                }
              : null,
            paymentIntentClientSecret: paymentIntent?.client_secret ?? null,
          },
          origin
        );
        return;
      }

      sendJson(res, 405, { error: "Method not allowed" }, origin);
      return;
    }

    if (pathname === "/api/stripe/subscriptions/manage") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      if (!stripeClient) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        subscriptionId?: string;
        action?: "cancel" | "resume" | "cancel_now";
      };
      if (!body.subscriptionId || !body.action) {
        sendJson(res, 400, { error: "subscriptionId and action are required" }, origin);
        return;
      }
      if (!["cancel", "resume", "cancel_now"].includes(body.action)) {
        sendJson(res, 400, { error: "Unsupported action" }, origin);
        return;
      }

      if (body.action === "cancel_now") {
        await stripeClient.subscriptions.del(body.subscriptionId);
      } else {
        await stripeClient.subscriptions.update(body.subscriptionId, {
          cancel_at_period_end: body.action === "cancel",
        });
      }

      const subscription = await stripeClient.subscriptions.retrieve(body.subscriptionId, {
        expand: ["latest_invoice.payment_intent", "latest_invoice", "customer"],
      });

      const store = await readOrderStore();
      upsertBillingSubscriptionSnapshot(store, subscription);
      if (typeof subscription.customer === "object") {
        upsertBillingCustomerSnapshot(store, subscription.customer);
      }
      const latestInvoice =
        subscription.latest_invoice && typeof subscription.latest_invoice === "object"
          ? (subscription.latest_invoice as Stripe.Invoice)
          : null;
      if (latestInvoice) {
        upsertBillingInvoiceSnapshot(store, latestInvoice);
        const billing = ensureStripeBillingState(store);
        const target = billing.subscriptions[subscription.id];
        if (target) {
          target.latestInvoiceStatus = latestInvoice.status;
          target.updatedAt = nowIso();
        }
      }
      await writeOrderStore(store);

      sendJson(
        res,
        200,
        {
          ok: true,
          action: body.action,
          subscription: {
            id: subscription.id,
            status: subscription.status,
            customerId: extractStripeId(subscription.customer),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            cancelAt: unixToIso(subscription.cancel_at),
            canceledAt: unixToIso(subscription.canceled_at),
            currentPeriodStart: unixToIso(subscription.current_period_start),
            currentPeriodEnd: unixToIso(subscription.current_period_end),
          },
        },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/webhook-dead-letter/retry") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      if (!stripeClient) {
        sendJson(res, 500, { error: "Missing Stripe credentials" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        eventId?: string;
        limit?: number;
        force?: boolean;
      };
      const limit = Math.min(100, Math.max(1, Number(body.limit ?? 20) || 20));
      const nowMs = Date.now();

      const store = await readOrderStore();
      const candidates = [...(store.stripeWebhookDeadLetters ?? [])]
        .filter((entry) => {
          if (body.eventId) return entry.eventId === body.eventId;
          if (body.force) return true;
          return Date.parse(entry.nextRetryAt) <= nowMs;
        })
        .sort((a, b) => Date.parse(a.lastFailedAt) - Date.parse(b.lastFailedAt))
        .slice(0, limit);

      let replayed = 0;
      let failed = 0;
      let skipped = 0;
      const results: Array<{
        eventId: string;
        eventType: string;
        status: "processed" | "ignored" | "failed" | "skipped";
        note?: string;
      }> = [];

      for (const entry of candidates) {
        const context: Partial<StripeWebhookLogEntry> = {
          orderId: entry.orderId,
          paymentIntentId: entry.paymentIntentId,
          sessionId: entry.sessionId,
          customerId: entry.customerId,
          subscriptionId: entry.subscriptionId,
          invoiceId: entry.invoiceId,
        };

        if (store.stripeEvents?.[entry.eventId]) {
          removeStripeWebhookDeadLetter(store, entry.eventId);
          appendStripeWebhookLog(store, {
            eventId: entry.eventId,
            eventType: entry.eventType,
            receivedAt: nowIso(),
            processedAt: nowIso(),
            status: "duplicate",
            handled: true,
            processed: false,
            duplicate: true,
            note: "Skipped replay because event is already marked processed",
            ...context,
          });
          skipped += 1;
          results.push({
            eventId: entry.eventId,
            eventType: entry.eventType,
            status: "skipped",
            note: "Already processed",
          });
          continue;
        }

        let event: Stripe.Event;
        try {
          event = await stripeClient.events.retrieve(entry.eventId);
        } catch (error) {
          const deadLetter = bumpStripeWebhookDeadLetterFailure(store, {
            eventId: entry.eventId,
            eventType: entry.eventType,
            error: error as Error,
            context,
          });
          appendStripeWebhookLog(store, {
            eventId: entry.eventId,
            eventType: entry.eventType,
            receivedAt: nowIso(),
            processedAt: nowIso(),
            status: "failed",
            handled: false,
            processed: false,
            duplicate: false,
            note: `Dead-letter replay failed to retrieve event: ${deadLetter.lastError}`,
            ...context,
          });
          failed += 1;
          results.push({
            eventId: entry.eventId,
            eventType: entry.eventType,
            status: "failed",
            note: deadLetter.lastError,
          });
          continue;
        }

        try {
          const outcome = await processStripeWebhookEvent(store, event);
          removeStripeWebhookDeadLetter(store, entry.eventId);
          markStripeWebhookProcessed(store, entry.eventId);
          appendStripeWebhookLog(store, {
            eventId: event.id,
            eventType: event.type,
            receivedAt: nowIso(),
            processedAt: nowIso(),
            status: outcome.didMutate ? "processed" : "ignored",
            handled: outcome.handledEvent,
            processed: outcome.didMutate,
            duplicate: false,
            note: outcome.note
              ? `${outcome.note}; replayed from dead-letter`
              : "Replayed from dead-letter",
            ...outcome.context,
          });
          replayed += 1;
          results.push({
            eventId: event.id,
            eventType: event.type,
            status: outcome.didMutate ? "processed" : "ignored",
            note: outcome.note,
          });
        } catch (error) {
          const deadLetter = upsertStripeWebhookDeadLetter(store, {
            event,
            error: error as Error,
            context,
          });
          appendStripeWebhookLog(store, {
            eventId: event.id,
            eventType: event.type,
            receivedAt: nowIso(),
            processedAt: nowIso(),
            status: "failed",
            handled: true,
            processed: false,
            duplicate: false,
            note: `Replay failed: ${deadLetter.lastError}`,
            ...context,
          });
          failed += 1;
          results.push({
            eventId: event.id,
            eventType: event.type,
            status: "failed",
            note: deadLetter.lastError,
          });
        }
      }

      await writeOrderStore(store);

      sendJson(
        res,
        200,
        {
          ok: true,
          requested: candidates.length,
          replayed,
          failed,
          skipped,
          remainingDeadLetters: (store.stripeWebhookDeadLetters ?? []).length,
          results,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/stripe/webhook-events") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const statusFilter = url.searchParams.get("status");
      const typeFilter = url.searchParams.get("type");
      const limitParam = Number(url.searchParams.get("limit") ?? 100);
      const limit = Number.isFinite(limitParam) ? Math.min(500, Math.max(1, limitParam)) : 100;

      const store = await readOrderStore();
      const billing = ensureStripeBillingState(store);
      let events = [...(store.stripeWebhookLog ?? [])];
      if (statusFilter) {
        events = events.filter((entry) => entry.status === statusFilter);
      }
      if (typeFilter) {
        events = events.filter((entry) => entry.eventType === typeFilter);
      }
      events.sort((a, b) => Date.parse(b.receivedAt) - Date.parse(a.receivedAt));

      const countsByStatus = events.reduce<Record<StripeWebhookLogStatus, number>>(
        (acc, entry) => {
          acc[entry.status] += 1;
          return acc;
        },
        { processed: 0, ignored: 0, duplicate: 0, failed: 0 }
      );
      const deadLetters = [...(store.stripeWebhookDeadLetters ?? [])].sort(
        (a, b) => Date.parse(b.lastFailedAt) - Date.parse(a.lastFailedAt)
      );
      const deadLetterDue = deadLetters.filter((entry) => Date.parse(entry.nextRetryAt) <= Date.now());

      sendJson(
        res,
        200,
        {
          total: events.length,
          returned: Math.min(limit, events.length),
          limit,
          filters: {
            status: statusFilter ?? null,
            type: typeFilter ?? null,
          },
          counts: {
            byStatus: countsByStatus,
            stripeEventCacheSize: Object.keys(store.stripeEvents ?? {}).length,
            deadLetters: {
              total: deadLetters.length,
              due: deadLetterDue.length,
            },
            billing: {
              customers: Object.keys(billing.customers).length,
              subscriptions: Object.keys(billing.subscriptions).length,
              invoices: Object.keys(billing.invoices).length,
            },
          },
          deadLetters: deadLetters.slice(0, 50),
          events: events.slice(0, limit),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/printify/shipping") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        lineItems?: PrintifyLineItem[];
        addressTo?: Record<string, string>;
      };

      if (!body.lineItems?.length || !body.addressTo) {
        sendJson(res, 400, { error: "lineItems and addressTo are required" }, origin);
        return;
      }

      const cacheKey = JSON.stringify({ lineItems: body.lineItems, addressTo: body.addressTo });
      const cached = shippingCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        sendJson(res, 200, cached.data, origin);
        return;
      }

      const { response, data } = await requestPrintifyShipping({
        lineItems: body.lineItems,
        addressTo: body.addressTo,
      });

      if (!response.ok) {
        sendJson(res, response.status, { error: "Printify shipping error", details: data }, origin);
        return;
      }

      shippingCache.set(cacheKey, {
        expiresAt: Date.now() + CONFIG.shippingCacheTtlMs,
        data,
      });
      sendJson(res, 200, data, origin);
      return;
    }

    if (pathname === "/api/printify/retry-sweep") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const result = await runPrintifyRetrySweep();
      sendJson(res, 200, { ok: true, ...result }, origin);
      return;
    }

    if (pathname === "/api/printify/orders") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        lineItems?: PrintifyLineItem[];
        addressTo?: Record<string, string>;
        shippingMethod?: string;
        sendShippingNotification?: boolean;
      };

      if (!body.lineItems?.length || !body.addressTo) {
        sendJson(res, 400, { error: "lineItems and addressTo are required" }, origin);
        return;
      }

      const { response, data } = await createPrintifyOrder({
        lineItems: body.lineItems,
        addressTo: body.addressTo,
        shippingMethod: body.shippingMethod,
        sendShippingNotification: body.sendShippingNotification,
      });

      if (!response.ok) {
        sendJson(res, response.status, { error: "Printify order error", details: data }, origin);
        return;
      }

      sendJson(res, 200, data, origin);
      return;
    }

    if (pathname === "/api/health") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      const [newsletterStore, reviewStore, analyticsStore, orderStore] = await Promise.all([
        readNewsletterStore(),
        readReviewStore(),
        readAnalyticsStore(),
        readOrderStore(),
      ]);
      const billing = ensureStripeBillingState(orderStore);
      sendJson(
        res,
        200,
        {
          ok: true,
          timestamp: nowIso(),
          stores: {
            newsletterSubscribers: newsletterStore.subscribers.length,
            reviewRequests: reviewStore.requests.length,
            reviews: reviewStore.reviews.length,
            analyticsEvents: analyticsStore.events.length,
            stripeEventCacheSize: Object.keys(orderStore.stripeEvents ?? {}).length,
            stripeWebhookLogEntries: orderStore.stripeWebhookLog?.length ?? 0,
            stripeWebhookDeadLetters: orderStore.stripeWebhookDeadLetters?.length ?? 0,
            stripeBillingCustomers: Object.keys(billing.customers).length,
            stripeBillingSubscriptions: Object.keys(billing.subscriptions).length,
            stripeBillingInvoices: Object.keys(billing.invoices).length,
          },
          integrations: {
            stripe: Boolean(CONFIG.stripeKey),
            stripeWebhook: Boolean(CONFIG.stripeWebhookSecret),
            printify: Boolean(CONFIG.printifyToken && CONFIG.printifyShopId),
            resend: Boolean(CONFIG.resendApiKey),
          },
        },
        origin
      );
      return;
    }

    if (pathname === "/api/analytics/event") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        event?: string;
        timestamp?: string;
        path?: string;
        device?: string;
        sessionId?: string;
        productId?: string;
        orderId?: string;
      };
      const event = (body.event ?? "").trim() as ConversionEventName;
      if (!CONVERSION_EVENT_SET.has(event)) {
        sendJson(res, 400, { error: "Unsupported conversion event" }, origin);
        return;
      }

      const timestamp = body.timestamp && !Number.isNaN(Date.parse(body.timestamp))
        ? new Date(body.timestamp).toISOString()
        : nowIso();
      const payload: ConversionEvent = {
        id: createId("metric"),
        event,
        timestamp,
        path: typeof body.path === "string" ? body.path.slice(0, 300) : "",
        device: body.device === "mobile" ? "mobile" : "desktop",
        sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 120) : undefined,
        productId: typeof body.productId === "string" ? body.productId.slice(0, 120) : undefined,
        orderId: typeof body.orderId === "string" ? body.orderId.slice(0, 120) : undefined,
      };

      const store = await readAnalyticsStore();
      store.events.push(payload);
      if (store.events.length > MAX_ANALYTICS_EVENTS) {
        store.events = store.events.slice(store.events.length - MAX_ANALYTICS_EVENTS);
      }
      store.updatedAt = nowIso();
      await writeAnalyticsStore(store);
      sendJson(res, 200, { ok: true }, origin);
      return;
    }

    if (pathname === "/api/analytics/funnel") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const daysParam = Number(url.searchParams.get("days") ?? 14);
      const days = Number.isFinite(daysParam) ? Math.max(1, Math.min(90, Math.floor(daysParam))) : 14;
      const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
      const store = await readAnalyticsStore();
      const scoped = store.events
        .filter((event) => Date.parse(event.timestamp) >= cutoffMs)
        .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp));

      const count = (event: ConversionEventName, device?: "mobile" | "desktop") =>
        scoped.filter((item) => item.event === event && (!device || item.device === device)).length;

      const heroImpressions = count("hero_impression");
      const heroClicks = count("hero_cta_click");
      const pdpViews = count("pdp_view");
      const pdpAddToCart = count("pdp_add_to_cart");
      const checkoutStarted = count("checkout_started");
      const checkoutCompleted = count("checkout_completed");

      const checkoutByDevice = (["mobile", "desktop"] as const).map((device) => {
        const started = count("checkout_started", device);
        const completed = count("checkout_completed", device);
        return {
          device,
          started,
          completed,
          completionRate: started ? Number((completed / started).toFixed(4)) : 0,
        };
      });

      sendJson(
        res,
        200,
        {
          windowDays: days,
          generatedAt: nowIso(),
          totals: {
            heroImpressions,
            heroClicks,
            pdpViews,
            pdpAddToCart,
            checkoutStarted,
            checkoutCompleted,
          },
          rates: {
            heroCtr: heroImpressions ? Number((heroClicks / heroImpressions).toFixed(4)) : 0,
            pdpAddToCartRate: pdpViews ? Number((pdpAddToCart / pdpViews).toFixed(4)) : 0,
            checkoutCompletionRate: checkoutStarted
              ? Number((checkoutCompleted / checkoutStarted).toFixed(4))
              : 0,
          },
          checkoutByDevice,
          recentEvents: scoped.slice(-80).reverse(),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/reviews/public") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const rawLimit = Number(url.searchParams.get("limit") ?? 12);
      const limit = Number.isFinite(rawLimit)
        ? Math.max(1, Math.min(50, Math.floor(rawLimit)))
        : 12;
      const productId = (url.searchParams.get("productId") ?? "").trim();
      const store = await readReviewStore();
      const published = store.reviews
        .filter((review) => review.status === "published")
        .filter((review) => (productId ? review.productId === productId : true))
        .sort((a, b) => {
          const aTime = Date.parse(a.publishedAt ?? a.createdAt);
          const bTime = Date.parse(b.publishedAt ?? b.createdAt);
          return bTime - aTime;
        });
      const items = published.slice(0, limit);
      const averageRating = items.length
        ? Number(
            (
              items.reduce((sum, review) => sum + Math.max(1, Math.min(5, review.rating)), 0) /
              items.length
            ).toFixed(2)
          )
        : 0;
      sendJson(
        res,
        200,
        {
          total: published.length,
          averageRating,
          reviews: items.map((review) => ({
            id: review.id,
            productId: review.productId,
            productName: review.productName,
            rating: review.rating,
            title: review.title,
            body: review.body,
            authorName: review.authorName,
            createdAt: review.publishedAt ?? review.createdAt,
            verified: true,
          })),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/reviews/request") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const token = (url.searchParams.get("token") ?? "").trim();
      if (!token) {
        sendJson(res, 400, { error: "token is required" }, origin);
        return;
      }

      const store = await readReviewStore();
      const request = store.requests.find((entry) => entry.token === token);
      if (!request) {
        sendJson(res, 404, { error: "Review request not found" }, origin);
        return;
      }
      if (Date.parse(request.expiresAt) < Date.now()) {
        sendJson(res, 410, { error: "Review request expired" }, origin);
        return;
      }

      const reviewedProducts = new Set(
        store.reviews
          .filter((review) => review.requestId === request.id)
          .map((review) => review.productId)
      );
      sendJson(
        res,
        200,
        {
          orderId: request.orderId,
          email: maskEmail(request.email),
          expiresAt: request.expiresAt,
          createdAt: request.createdAt,
          items: request.items.map((item) => ({
            ...item,
            alreadyReviewed: reviewedProducts.has(item.productId),
          })),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/reviews/submit") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        token?: string;
        productId?: string;
        rating?: number;
        title?: string;
        body?: string;
        authorName?: string;
      };

      const token = (body.token ?? "").trim();
      const productId = (body.productId ?? "").trim();
      const rating = Number(body.rating ?? 0);
      const title = (body.title ?? "").trim();
      const reviewBody = (body.body ?? "").trim();
      const authorName = (body.authorName ?? "").trim();

      if (!token || !productId) {
        sendJson(res, 400, { error: "token and productId are required" }, origin);
        return;
      }
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        sendJson(res, 400, { error: "rating must be 1-5" }, origin);
        return;
      }
      if (reviewBody.length < 16) {
        sendJson(res, 400, { error: "review body must be at least 16 characters" }, origin);
        return;
      }

      const store = await readReviewStore();
      const request = store.requests.find((entry) => entry.token === token);
      if (!request) {
        sendJson(res, 404, { error: "Review request not found" }, origin);
        return;
      }
      if (Date.parse(request.expiresAt) < Date.now()) {
        sendJson(res, 410, { error: "Review request expired" }, origin);
        return;
      }
      const targetItem = request.items.find((item) => item.productId === productId);
      if (!targetItem) {
        sendJson(res, 400, { error: "Product is not in this review request" }, origin);
        return;
      }
      const alreadySubmitted = store.reviews.some(
        (review) => review.requestId === request.id && review.productId === productId
      );
      if (alreadySubmitted) {
        sendJson(res, 409, { error: "Review already submitted for this product" }, origin);
        return;
      }

      const review: StoredReview = {
        id: createId("review"),
        requestId: request.id,
        requestToken: token,
        orderId: request.orderId,
        productId: targetItem.productId,
        productName: targetItem.name,
        rating: Math.round(rating),
        title: title || "Verified purchase review",
        body: reviewBody,
        authorName: authorName || request.firstName || "Verified Buyer",
        createdAt: nowIso(),
        status: "pending",
      };

      store.reviews.push(review);
      store.updatedAt = nowIso();
      await writeReviewStore(store);

      sendJson(
        res,
        200,
        {
          ok: true,
          review: {
            id: review.id,
            status: review.status,
            productId: review.productId,
          },
        },
        origin
      );
      return;
    }

    if (pathname === "/api/reviews/moderation") {
      if (req.method === "GET") {
        const store = await readReviewStore();
        const pending = store.reviews
          .filter((review) => review.status === "pending")
          .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
        const recent = store.reviews
          .filter((review) => review.status !== "pending")
          .sort((a, b) => Date.parse(b.moderatedAt ?? b.createdAt) - Date.parse(a.moderatedAt ?? a.createdAt))
          .slice(0, 40);
        sendJson(
          res,
          200,
          {
            pending,
            recent,
            counts: {
              pending: pending.length,
              published: store.reviews.filter((review) => review.status === "published").length,
              rejected: store.reviews.filter((review) => review.status === "rejected").length,
            },
          },
          origin
        );
        return;
      }

      if (req.method === "POST") {
        const body = (await readJson(req)) as {
          reviewId?: string;
          action?: "publish" | "reject";
          reason?: string;
          moderator?: string;
        };
        const reviewId = (body.reviewId ?? "").trim();
        if (!reviewId) {
          sendJson(res, 400, { error: "reviewId is required" }, origin);
          return;
        }

        if (body.action !== "publish" && body.action !== "reject") {
          sendJson(res, 400, { error: "action must be publish or reject" }, origin);
          return;
        }

        const store = await readReviewStore();
        const target = store.reviews.find((review) => review.id === reviewId);
        if (!target) {
          sendJson(res, 404, { error: "Review not found" }, origin);
          return;
        }

        const timestamp = nowIso();
        target.status = body.action === "publish" ? "published" : "rejected";
        target.moderatedAt = timestamp;
        target.moderatedBy = body.moderator?.trim() || "admin";
        if (target.status === "published") {
          target.publishedAt = timestamp;
          target.rejectedReason = undefined;
        } else {
          target.rejectedReason = body.reason?.trim() || "Not approved";
          target.publishedAt = undefined;
        }
        store.updatedAt = timestamp;
        await writeReviewStore(store);
        sendJson(res, 200, { ok: true, review: target }, origin);
        return;
      }

      sendJson(res, 405, { error: "Method not allowed" }, origin);
      return;
    }

    if (pathname === "/api/newsletter/subscribe") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as { email?: string; source?: string };
      const email = (body.email ?? "").trim().toLowerCase();
      if (!isValidEmail(email)) {
        sendJson(res, 400, { error: "Valid email is required" }, origin);
        return;
      }

      const store = await readNewsletterStore();
      const source = (body.source ?? "site").trim() || "site";
      const existing = store.subscribers.find((entry) => entry.email === email);
      if (existing) {
        existing.status = "subscribed";
        existing.source = source;
        existing.subscribedAt = nowIso();
      } else {
        store.subscribers.push({
          email,
          source,
          subscribedAt: nowIso(),
          status: "subscribed",
        });
      }
      await writeNewsletterStore(store);
      sendJson(
        res,
        200,
        {
          ok: true,
          subscribers: store.subscribers.filter((entry) => entry.status === "subscribed").length,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/newsletter/unsubscribe") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as { email?: string };
      const email = (body.email ?? "").trim().toLowerCase();
      if (!isValidEmail(email)) {
        sendJson(res, 400, { error: "Valid email is required" }, origin);
        return;
      }

      const store = await readNewsletterStore();
      const existing = store.subscribers.find((entry) => entry.email === email);
      if (existing) {
        existing.status = "unsubscribed";
      } else {
        store.subscribers.push({
          email,
          source: "unsubscribe",
          subscribedAt: nowIso(),
          status: "unsubscribed",
        });
      }
      await writeNewsletterStore(store);
      sendJson(
        res,
        200,
        {
          ok: true,
          subscribers: store.subscribers.filter((entry) => entry.status === "subscribed").length,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/newsletter/subscribers") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const store = await readNewsletterStore();
      const active = store.subscribers.filter((entry) => entry.status === "subscribed");
      sendJson(
        res,
        200,
        {
          total: active.length,
          subscribers: active,
          campaigns: store.campaigns.slice().reverse().slice(0, 15),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/newsletter/send-drop") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        subject?: string;
        headline?: string;
        body?: string;
        ctaUrl?: string;
        testEmail?: string;
      };

      const subject = (body.subject ?? "").trim();
      const headline = (body.headline ?? "").trim();
      const messageBody = (body.body ?? "").trim();
      const ctaUrl = body.ctaUrl?.trim();
      if (!subject || !headline || !messageBody) {
        sendJson(res, 400, { error: "subject, headline, and body are required" }, origin);
        return;
      }

      const store = await readNewsletterStore();
      const recipients = body.testEmail?.trim()
        ? [body.testEmail.trim().toLowerCase()]
        : store.subscribers
            .filter((entry) => entry.status === "subscribed")
            .map((entry) => entry.email);

      if (!recipients.length) {
        sendJson(res, 400, { error: "No subscribed recipients available" }, origin);
        return;
      }

      const errors: string[] = [];
      let sentCount = 0;
      let provider: "resend" | "dry_run" = "dry_run";

      if (CONFIG.resendApiKey && CONFIG.newsletterFromEmail) {
        provider = "resend";
        for (const email of recipients) {
          const unsubscribeUrl = `${CONFIG.stripeClientBase}/unsubscribe?email=${encodeURIComponent(
            email
          )}`;
          const html = buildNewsletterHtml({
            headline,
            body: messageBody,
            ctaUrl,
            unsubscribeUrl,
          });
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CONFIG.resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: CONFIG.newsletterFromEmail,
              to: [email],
              subject,
              html,
              reply_to: CONFIG.newsletterReplyTo || undefined,
            }),
          });
          if (!response.ok) {
            const text = await response.text();
            errors.push(`${email}: ${text || `http_${response.status}`}`);
            continue;
          }
          sentCount += 1;
        }
      } else {
        sentCount = recipients.length;
      }

      const campaign: NewsletterCampaign = {
        id: createId("campaign"),
        subject,
        headline,
        body: messageBody,
        ctaUrl,
        sentAt: nowIso(),
        recipients: recipients.length,
        provider,
        errors,
      };
      store.campaigns.push(campaign);
      await writeNewsletterStore(store);

      sendJson(
        res,
        200,
        {
          ok: true,
          provider,
          requestedRecipients: recipients.length,
          sent: sentCount,
          errors,
          campaign,
        },
        origin
      );
      return;
    }

    if (pathname === "/api/social/providers") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      sendJson(
        res,
        200,
        {
          script: [
            { id: "manual", label: "Manual Script" },
            { id: "scribe", label: "Scribe GenAI (stub)" },
          ],
          video: [
            { id: "manual", label: "Manual Upload" },
            { id: "sora", label: "Sora (stub)" },
            { id: "veo3", label: "Google Veo 3 (stub)" },
          ],
          audio: [
            { id: "manual", label: "Manual Voiceover" },
            { id: "lipsync", label: "Lipsync TTS (stub)" },
          ],
        },
        origin
      );
      return;
    }

    if (pathname === "/api/social/state") {
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      const store = await readSocialStore();
      sendJson(
        res,
        200,
        {
          ...store,
          metrics: aggregateSocialMetrics(store),
        },
        origin
      );
      return;
    }

    if (pathname === "/api/social/accounts/upsert") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      const body = (await readJson(req)) as Partial<SocialAccount>;
      if (!body.platform || !body.handle) {
        sendJson(res, 400, { error: "platform and handle are required" }, origin);
        return;
      }
      const store = await readSocialStore();
      const platform = normalizePlatform(body.platform);
      const handle = String(body.handle).trim();
      const id = body.id || createId("acct");
      const existing = store.accounts.find((item) => item.id === id);
      const payload: SocialAccount = {
        id,
        platform,
        handle,
        status: body.status ?? "connected",
        followers: Number.isFinite(body.followers) ? Number(body.followers) : 0,
        profileUrl: body.profileUrl ? String(body.profileUrl) : "",
        lastSyncAt: body.lastSyncAt ?? nowIso(),
      };
      if (existing) {
        Object.assign(existing, payload);
      } else {
        store.accounts.push(payload);
      }
      store.updatedAt = nowIso();
      await writeSocialStore(store);
      sendJson(res, 200, { ok: true, account: payload }, origin);
      return;
    }

    if (pathname === "/api/social/posts/upsert") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      const body = (await readJson(req)) as Partial<SocialPost>;
      const title = (body.title ?? "").trim();
      if (!title) {
        sendJson(res, 400, { error: "title is required" }, origin);
        return;
      }

      const store = await readSocialStore();
      const id = body.id ?? createId("post");
      const existing = store.posts.find((entry) => entry.id === id);
      const platforms = normalizePlatformList(body.platforms);
      const normalizedStatus = body.status ?? (body.scheduledFor ? "scheduled" : "draft");
      const postPayload: SocialPost = {
        id,
        title,
        caption: body.caption ?? "",
        platforms: platforms.length ? platforms : ["instagram"],
        status: normalizedStatus,
        scheduledFor: normalizedStatus === "scheduled" ? body.scheduledFor ?? nowIso() : null,
        publishedAt: normalizedStatus === "published" ? nowIso() : null,
        assetUrl: body.assetUrl ?? "",
        voiceoverPrompt: body.voiceoverPrompt ?? "",
        source: body.source ?? "native",
        pipelineRef: body.pipelineRef ?? null,
        metricsByPlatform: body.metricsByPlatform ?? {},
        createdAt: existing?.createdAt ?? nowIso(),
        updatedAt: nowIso(),
      };
      if (existing) {
        Object.assign(existing, postPayload);
      } else {
        store.posts.push(postPayload);
      }
      store.updatedAt = nowIso();
      await writeSocialStore(store);
      sendJson(res, 200, { ok: true, post: postPayload }, origin);
      return;
    }

    if (pathname === "/api/social/automation/update") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }
      const body = (await readJson(req)) as Partial<SocialAutomationConfig>;
      const store = await readSocialStore();
      store.automation = {
        scriptProvider: body.scriptProvider ?? store.automation.scriptProvider,
        videoProvider: body.videoProvider ?? store.automation.videoProvider,
        audioProvider: body.audioProvider ?? store.automation.audioProvider,
        autoPublish:
          typeof body.autoPublish === "boolean" ? body.autoPublish : store.automation.autoPublish,
        defaultHashtags: Array.isArray(body.defaultHashtags)
          ? body.defaultHashtags
              .filter((item): item is string => typeof item === "string")
              .map((item) => item.trim())
              .filter(Boolean)
          : store.automation.defaultHashtags,
      };
      store.updatedAt = nowIso();
      await writeSocialStore(store);
      sendJson(res, 200, { ok: true, automation: store.automation }, origin);
      return;
    }

    if (pathname === "/api/social/sync/pipelinemanager") {
      if (req.method !== "POST") {
        sendJson(res, 405, { error: "Method not allowed" }, origin);
        return;
      }

      const body = (await readJson(req)) as {
        baseUrl?: string;
        exportPath?: string;
      };
      const warnings: string[] = [];
      const importedPosts: SocialPost[] = [];

      const pipelineBaseUrl = (body.baseUrl ?? CONFIG.pipelineManagerBaseUrl ?? "").trim();
      if (pipelineBaseUrl) {
        try {
          const { response, data } = await fetchJson(
            `${pipelineBaseUrl.replace(/\/$/, "")}/api/workflows`,
            {
              method: "GET",
              headers: { Accept: "application/json" },
            }
          );
          if (response.ok) {
            const candidate = Array.isArray(data)
              ? data
              : Array.isArray(data?.workflows)
                ? data.workflows
                : [];
            candidate.forEach((item) => {
              if (!item || typeof item !== "object") return;
              const mapped = mapPipelineItemToSocialPost(item as Record<string, unknown>);
              if (mapped) importedPosts.push(mapped);
            });
          } else {
            warnings.push(`PipelineManager API returned ${response.status}`);
          }
        } catch (error) {
          warnings.push(`PipelineManager API sync failed: ${(error as Error).message}`);
        }
      }

      const pipelineExportPath = (body.exportPath ?? CONFIG.pipelineManagerExportPath ?? "").trim();
      if (pipelineExportPath) {
        try {
          const absolutePath = path.isAbsolute(pipelineExportPath)
            ? pipelineExportPath
            : path.join(REPO_ROOT, pipelineExportPath);
          const raw = await fs.readFile(absolutePath, "utf-8");
          const parsed = JSON.parse(raw) as unknown;
          const candidate = Array.isArray(parsed)
            ? parsed
            : parsed && typeof parsed === "object"
              ? (Array.isArray((parsed as Record<string, unknown>).workflows)
                  ? ((parsed as Record<string, unknown>).workflows as unknown[])
                  : Array.isArray((parsed as Record<string, unknown>).posts)
                    ? ((parsed as Record<string, unknown>).posts as unknown[])
                    : [])
              : [];

          candidate.forEach((item) => {
            if (!item || typeof item !== "object") return;
            const mapped = mapPipelineItemToSocialPost(item as Record<string, unknown>);
            if (mapped) importedPosts.push(mapped);
          });
        } catch (error) {
          warnings.push(`PipelineManager export sync failed: ${(error as Error).message}`);
        }
      }

      if (!pipelineBaseUrl && !pipelineExportPath) {
        warnings.push(
          "No PipelineManager source configured. Set PIPELINE_MANAGER_ORCHESTRATOR_URL or PIPELINE_MANAGER_EXPORT_PATH."
        );
      }

      const store = await readSocialStore();
      let created = 0;
      let updated = 0;
      importedPosts.forEach((post) => {
        const existing = post.pipelineRef
          ? store.posts.find((entry) => entry.pipelineRef === post.pipelineRef)
          : null;
        if (existing) {
          existing.title = post.title;
          existing.caption = post.caption;
          existing.platforms = post.platforms;
          existing.status = post.status;
          existing.scheduledFor = post.scheduledFor;
          existing.updatedAt = nowIso();
          updated += 1;
        } else {
          store.posts.push(post);
          created += 1;
        }
      });

      store.updatedAt = nowIso();
      await writeSocialStore(store);
      sendJson(
        res,
        200,
        {
          ok: true,
          created,
          updated,
          importedCandidates: importedPosts.length,
          warnings,
          metrics: aggregateSocialMetrics(store),
        },
        origin
      );
      return;
    }

    sendJson(res, 404, { error: "Not found" }, origin);
  } catch (error) {
    sendJson(res, 500, { error: (error as Error).message }, origin);
  }
});

server.listen(CONFIG.port, () => {
  console.log(`API server running on http://localhost:${CONFIG.port}`);

  if (!CONFIG.disablePrintifyRetryWorker) {
    const sweepIntervalMs = Math.max(5000, CONFIG.printifyRetrySweepMs);
    const runSweep = async () => {
      try {
        const result = await runPrintifyRetrySweep();
        if (result.attempted > 0) {
          console.log(
            `[printify-retry] attempted=${result.attempted} submitted=${result.submitted} failed=${result.failed}`
          );
        }
      } catch (error) {
        console.error(`[printify-retry] sweep failed: ${(error as Error).message}`);
      }
    };

    void runSweep();
    setInterval(() => {
      void runSweep();
    }, sweepIntervalMs);
  }
});

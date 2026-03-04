import { CONSENT_EVENT_NAME, isOptionalTrackingAllowed } from "@/lib/consent";

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID?.trim();
const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID?.trim();
const CURRENCY = (import.meta.env.VITE_ANALYTICS_CURRENCY ?? "USD").toUpperCase();

type AnalyticsItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  color?: string;
  size?: string;
};

type EcommercePayload = {
  currency?: string;
  value?: number;
  items?: AnalyticsItem[];
  orderId?: string;
  paymentType?: string;
};

let analyticsReady = false;

const toEventItems = (items: AnalyticsItem[] = []) =>
  items.map((item) => ({
    item_id: item.id,
    item_name: item.name,
    item_category: item.category,
    item_variant: [item.color, item.size].filter(Boolean).join(" / ") || undefined,
    price: Number(item.price.toFixed(2)),
    quantity: item.quantity,
  }));

const toMetaContents = (items: AnalyticsItem[] = []) =>
  items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    item_price: Number(item.price.toFixed(2)),
  }));

const withOptionalTracking = (callback: () => void) => {
  if (typeof window === "undefined") return;
  if (!isOptionalTrackingAllowed()) return;
  callback();
};

const ensureGoogleTag = () => {
  if (!GA_MEASUREMENT_ID) return;
  const win = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  win.dataLayer = win.dataLayer ?? [];
  if (!win.gtag) {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer?.push(args);
    };
  }

  if (!document.getElementById("looksmax-ga-tag")) {
    const script = document.createElement("script");
    script.id = "looksmax-ga-tag";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      GA_MEASUREMENT_ID
    )}`;
    document.head.appendChild(script);
  }

  win.gtag("js", new Date());
  win.gtag("config", GA_MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });
};

const ensureMetaPixel = () => {
  if (!META_PIXEL_ID) return;
  const win = window as Window & {
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      callMethod?: (...args: unknown[]) => void;
      push?: (...args: unknown[]) => void;
      loaded?: boolean;
      version?: string;
    };
  };

  if (!win.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    }) as typeof win.fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    win.fbq = fbq;
  }

  if (!document.getElementById("looksmax-meta-pixel")) {
    const script = document.createElement("script");
    script.id = "looksmax-meta-pixel";
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  win.fbq("init", META_PIXEL_ID);
  win.fbq("consent", "grant");
};

const ensureTikTokPixel = () => {
  if (!TIKTOK_PIXEL_ID) return;
  const win = window as Window & { ttq?: Record<string, unknown> & unknown[] };
  if (!win.ttq) {
    const ttq: Record<string, unknown> & unknown[] = [] as unknown as Record<string, unknown> &
      unknown[];
    const methods = [
      "page",
      "track",
      "identify",
      "instances",
      "debug",
      "on",
      "off",
      "once",
      "ready",
      "alias",
      "group",
      "enableCookie",
      "disableCookie",
    ];
    const setAndDefer = (target: Record<string, unknown> & unknown[], method: string) => {
      target[method] = (...args: unknown[]) => {
        target.push([method, ...args]);
      };
    };

    methods.forEach((method) => setAndDefer(ttq, method));
    ttq.load = (pixelId: string) => {
      const script = document.createElement("script");
      script.id = "looksmax-tiktok-pixel";
      script.async = true;
      script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(
        pixelId
      )}&lib=ttq`;
      document.head.appendChild(script);
    };
    win.ttq = ttq;
  }

  const ttq = win.ttq as unknown as {
    load: (pixelId: string) => void;
    page: () => void;
  };
  if (!document.getElementById("looksmax-tiktok-pixel")) {
    ttq.load(TIKTOK_PIXEL_ID);
  }
};

const mapToMetaEvent = (event: string) => {
  switch (event) {
    case "view_item":
      return "ViewContent";
    case "add_to_cart":
      return "AddToCart";
    case "begin_checkout":
      return "InitiateCheckout";
    case "add_payment_info":
      return "AddPaymentInfo";
    case "purchase":
      return "Purchase";
    default:
      return null;
  }
};

export const initializeAnalytics = () => {
  withOptionalTracking(() => {
    ensureGoogleTag();
    ensureMetaPixel();
    ensureTikTokPixel();
    analyticsReady = true;
  });
};

const dispatchEvent = (event: string, payload: EcommercePayload = {}) => {
  withOptionalTracking(() => {
    if (!analyticsReady) initializeAnalytics();
    const currency = payload.currency ?? CURRENCY;
    const items = payload.items ?? [];
    const eventItems = toEventItems(items);
    const value =
      typeof payload.value === "number"
        ? Number(payload.value.toFixed(2))
        : Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));

    const win = window as Window & {
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
      ttq?: { track?: (...args: unknown[]) => void };
    };

    try {
      win.gtag?.("event", event, {
        currency,
        value,
        items: eventItems,
        transaction_id: payload.orderId,
        payment_type: payload.paymentType,
      });
    } catch {
      // noop
    }

    const metaEvent = mapToMetaEvent(event);
    if (metaEvent) {
      try {
        win.fbq?.("track", metaEvent, {
          currency,
          value,
          content_type: "product",
          content_ids: items.map((item) => item.id),
          contents: toMetaContents(items),
          num_items: items.reduce((sum, item) => sum + item.quantity, 0),
          order_id: payload.orderId,
        });
      } catch {
        // noop
      }
    }

    if (metaEvent) {
      try {
        win.ttq?.track?.(metaEvent, {
          currency,
          value,
          content_id: items.map((item) => item.id),
          contents: toMetaContents(items),
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        });
      } catch {
        // noop
      }
    }
  });
};

export const trackPageView = (path: string) => {
  withOptionalTracking(() => {
    if (!analyticsReady) initializeAnalytics();
    const win = window as Window & {
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
      ttq?: { page?: () => void };
    };

    try {
      if (GA_MEASUREMENT_ID) {
        win.gtag?.("config", GA_MEASUREMENT_ID, {
          page_path: path,
        });
      }
    } catch {
      // noop
    }

    try {
      win.fbq?.("track", "PageView");
    } catch {
      // noop
    }

    try {
      win.ttq?.page?.();
    } catch {
      // noop
    }
  });
};

export const trackViewItem = (item: AnalyticsItem) => {
  dispatchEvent("view_item", {
    items: [item],
    value: item.price * item.quantity,
  });
};

export const trackAddToCart = (items: AnalyticsItem[]) => {
  dispatchEvent("add_to_cart", {
    items,
  });
};

export const trackBeginCheckout = (items: AnalyticsItem[], total: number) => {
  dispatchEvent("begin_checkout", {
    items,
    value: total,
  });
};

export const trackAddPaymentInfo = (items: AnalyticsItem[], total: number, paymentType: string) => {
  dispatchEvent("add_payment_info", {
    items,
    value: total,
    paymentType,
  });
};

export const trackPurchase = (orderId: string, items: AnalyticsItem[], total: number) => {
  dispatchEvent("purchase", {
    items,
    value: total,
    orderId,
  });
};

export const attachConsentAnalyticsListener = () => {
  if (typeof window === "undefined") return () => undefined;
  const handleConsentUpdated = () => {
    initializeAnalytics();
  };
  window.addEventListener(CONSENT_EVENT_NAME, handleConsentUpdated);
  return () => {
    window.removeEventListener(CONSENT_EVENT_NAME, handleConsentUpdated);
  };
};

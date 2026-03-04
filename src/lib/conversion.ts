import { API_BASE } from "@/lib/api";

export type ConversionEventName =
  | "hero_impression"
  | "hero_cta_click"
  | "pdp_view"
  | "pdp_add_to_cart"
  | "checkout_started"
  | "checkout_completed";

const SESSION_STORAGE_KEY = "looksmax.conversion.session_id";
const EVENT_DEDUPE_PREFIX = "looksmax.conversion.once.";

const getSessionId = () => {
  if (typeof window === "undefined") return "";
  try {
    const current = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (current) return current;
    const generated = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, generated);
    return generated;
  } catch {
    return "";
  }
};

const getDeviceType = (): "mobile" | "desktop" => {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
};

export const trackConversionEvent = (
  event: ConversionEventName,
  payload?: { productId?: string; orderId?: string }
) => {
  if (typeof window === "undefined") return;
  const body = {
    event,
    timestamp: new Date().toISOString(),
    path: `${window.location.pathname}${window.location.search}`,
    device: getDeviceType(),
    sessionId: getSessionId(),
    productId: payload?.productId,
    orderId: payload?.orderId,
  };
  void fetch(`${API_BASE}/api/analytics/event`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
};

export const trackConversionEventOnce = (
  key: string,
  event: ConversionEventName,
  payload?: { productId?: string; orderId?: string }
) => {
  if (typeof window === "undefined") return;
  const cacheKey = `${EVENT_DEDUPE_PREFIX}${key}`;
  try {
    if (window.sessionStorage.getItem(cacheKey)) return;
    window.sessionStorage.setItem(cacheKey, "1");
  } catch {
    // fall through and still track
  }
  trackConversionEvent(event, payload);
};

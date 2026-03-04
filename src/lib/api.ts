export const API_BASE =
  import.meta.env.VITE_PRINTIFY_API_BASE ?? "http://localhost:3031";
const ADMIN_API_TOKEN = import.meta.env.VITE_ADMIN_API_TOKEN ?? "";

export const apiUrl = (pathname: string) =>
  `${API_BASE}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;

const requiresAdminToken = (pathname: string) =>
  pathname.startsWith("/api/social") ||
  pathname === "/api/stripe/webhook-events" ||
  pathname === "/api/stripe/webhook-dead-letter/retry" ||
  pathname === "/api/stripe/subscriptions" ||
  pathname === "/api/stripe/subscriptions/manage" ||
  pathname === "/api/newsletter/subscribers" ||
  pathname === "/api/newsletter/send-drop" ||
  pathname === "/api/reviews/moderation" ||
  pathname === "/api/analytics/funnel";

export const apiFetch = async <T>(pathname: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (ADMIN_API_TOKEN && requiresAdminToken(pathname)) {
    headers.set("X-Admin-Token", ADMIN_API_TOKEN);
  }

  const response = await fetch(apiUrl(pathname), {
    headers,
    ...init,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T & { error?: string })
    : ({} as T & { error?: string });

  if (!response.ok) {
    const message =
      (payload as { error?: string })?.error ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
};

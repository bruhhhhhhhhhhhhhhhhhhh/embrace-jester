// Legacy storage key kept to avoid silently resetting existing storefront consent state.
export const CONSENT_STORAGE_KEY = "looksmax.cookie-consent.v1";
export const CONSENT_EVENT_NAME = "looksmax:consent-updated";

export type ConsentStatus = "accepted" | "essential_only";

export type StoredConsent = {
  status: ConsentStatus;
  updatedAt: string;
};

export const isStoredConsent = (value: unknown): value is StoredConsent => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StoredConsent>;
  return (
    (candidate.status === "accepted" || candidate.status === "essential_only") &&
    typeof candidate.updatedAt === "string"
  );
};

export const readStoredConsent = (): StoredConsent | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isStoredConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearStoredConsent = () => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // Ignore localStorage write failures and continue for this session.
  }
  broadcastConsentUpdated("essential_only");
};

export const isGlobalPrivacyControlEnabled = () => {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl);
};

export const getConsentStatus = (): ConsentStatus | null => {
  const stored = readStoredConsent()?.status ?? null;
  if (stored) return stored;
  if (isGlobalPrivacyControlEnabled()) return "essential_only";
  return null;
};

export const isOptionalTrackingAllowed = () => getConsentStatus() === "accepted";

export const broadcastConsentUpdated = (status: ConsentStatus) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CONSENT_EVENT_NAME, {
      detail: {
        status,
      },
    })
  );
};

export const persistConsent = (status: ConsentStatus) => {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = {
    status,
    updatedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore localStorage write failures and continue for this session.
  }
  broadcastConsentUpdated(status);
};

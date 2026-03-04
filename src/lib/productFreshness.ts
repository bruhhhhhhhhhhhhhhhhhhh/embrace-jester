const DEFAULT_NEW_WINDOW_DAYS = 45;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const configuredWindowDays = Number(import.meta.env.VITE_NEW_PRODUCT_WINDOW_DAYS);
const NEW_WINDOW_DAYS = Number.isFinite(configuredWindowDays)
  ? Math.max(1, Math.floor(configuredWindowDays))
  : DEFAULT_NEW_WINDOW_DAYS;

export const toTimestamp = (value?: string) => {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const isNewProduct = (createdAt?: string, nowMs = Date.now()) => {
  const createdAtMs = toTimestamp(createdAt);
  if (!createdAtMs) return false;
  return nowMs - createdAtMs <= NEW_WINDOW_DAYS * ONE_DAY_MS;
};

export const getNewProductWindowDays = () => NEW_WINDOW_DAYS;

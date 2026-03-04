import type { CartItem } from "@/components/cart/cart";

export type OrderSummary = {
  id: string;
  createdAt: string;
  items: CartItem[];
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
  stripe?: {
    sessionId?: string;
    paymentIntentId?: string;
    status?: string;
    paymentStatus?: string;
  };
  printify?: {
    orderId?: string;
  };
};

export const ORDER_STORAGE_KEY = "looksmax.order.latest";

export const saveOrder = (order: OrderSummary) => {
  try {
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(order));
  } catch {
    // ignore write failures
  }
};

export const loadOrder = (): OrderSummary | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ORDER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OrderSummary) : null;
  } catch {
    return null;
  }
};

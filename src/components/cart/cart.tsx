import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { trackAddToCart } from "@/lib/analytics";

/* eslint-disable react-refresh/only-export-components */

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
  printify?: {
    productId: string;
    variantId?: number;
    blueprintId?: number;
    printProviderId?: number;
  };
  variantKey: string;
};

type CartState = {
  items: CartItem[];
  count: number;
  subtotal: number;
};

type CartActions = {
  add: (item: Omit<CartItem, "quantity" | "variantKey"> & { quantity?: number }) => void;
  remove: (variantKey: string) => void;
  setQty: (variantKey: string, quantity: number) => void;
  updateVariant: (variantKey: string, updates: { size?: string; color?: string }) => void;
  clear: () => void;
};

const CartStateContext = createContext<CartState | null>(null);
const CartActionsContext = createContext<CartActions | null>(null);
const STORAGE_KEY = "looksmax.cart.v1";

type StoredCartItem = Omit<CartItem, "variantKey"> & { variantKey?: string };

function keyOf(item: { id: string; size?: string; color?: string }) {
  return `${item.id}::${item.size ?? ""}::${item.color ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredCartItem[]) : [];
      return parsed.map((item) => ({
        ...item,
        variantKey: item.variantKey ?? keyOf(item),
      }));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore write failures
    }
  }, [items]);

  const add = useCallback(
    (item: Omit<CartItem, "quantity" | "variantKey"> & { quantity?: number }) => {
      const quantity = item.quantity ?? 1;
      const variantKey = keyOf(item);
      trackAddToCart([
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity,
          color: item.color,
          size: item.size,
        },
      ]);
      setItems((prev) => {
        const idx = prev.findIndex((p) => p.variantKey === variantKey);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
          return next;
        }
        return [...prev, { ...item, quantity, variantKey }];
      });
    },
    []
  );

  const remove = useCallback((variantKey: string) => {
    setItems((prev) => prev.filter((item) => item.variantKey !== variantKey));
  }, []);

  const setQty = useCallback((variantKey: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.variantKey === variantKey ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const updateVariant = useCallback((variantKey: string, updates: { size?: string; color?: string }) => {
    setItems((prev) => {
      const current = prev.find((item) => item.variantKey === variantKey);
      if (!current) return prev;
      const nextItem = { ...current, ...updates };
      const nextVariantKey = keyOf(nextItem);
      if (nextVariantKey === current.variantKey) return prev;
      const existing = prev.find((item) => item.variantKey === nextVariantKey);

      return prev.reduce<CartItem[]>((acc, item) => {
        if (item.variantKey === current.variantKey) {
          if (existing) {
            return acc;
          }
          acc.push({ ...nextItem, variantKey: nextVariantKey });
          return acc;
        }

        if (item.variantKey === nextVariantKey) {
          acc.push({
            ...item,
            ...nextItem,
            variantKey: nextVariantKey,
            quantity: item.quantity + current.quantity,
          });
          return acc;
        }

        acc.push(item);
        return acc;
      }, []);
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const stateValue = useMemo<CartState>(
    () => ({
      items,
      count: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotal: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    [items]
  );

  const actionsValue = useMemo<CartActions>(
    () => ({ add, remove, setQty, updateVariant, clear }),
    [add, remove, setQty, updateVariant, clear]
  );

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartActionsContext.Provider value={actionsValue}>{children}</CartActionsContext.Provider>
    </CartStateContext.Provider>
  );
}

export function useCartState() {
  const ctx = useContext(CartStateContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCartActions() {
  const ctx = useContext(CartActionsContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function useCart() {
  const state = useCartState();
  const actions = useCartActions();
  return useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

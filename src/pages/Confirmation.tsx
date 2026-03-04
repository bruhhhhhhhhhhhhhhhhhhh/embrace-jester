import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { loadOrder } from "@/lib/order";
import { formatMoney } from "@/lib/money";
import { trackPurchase } from "@/lib/analytics";
import { trackConversionEventOnce } from "@/lib/conversion";

const PURCHASE_EVENT_CACHE_KEY = "looksmax.analytics.purchase.last";

const Confirmation = () => {
  const order = loadOrder();
  const location = useLocation();
  const API_BASE =
    import.meta.env.VITE_PRINTIFY_API_BASE ?? "http://localhost:3031";
  const [stripeStatus, setStripeStatus] = useState<{
    status?: string;
    paymentStatus?: string | null;
    paymentIntentId?: string | null;
    sessionId?: string | null;
    printifyOrderId?: string | null;
    printifyError?: string | null;
  } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const purchaseTrackedRef = useRef<string | null>(null);

  const paymentIntentId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("payment_intent") ?? order?.stripe?.paymentIntentId ?? null;
  }, [location.search, order?.stripe?.paymentIntentId]);

  const sessionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("session_id") ?? order?.stripe?.sessionId ?? null;
  }, [location.search, order?.stripe?.sessionId]);

  const statusLookupQuery = useMemo(() => {
    if (paymentIntentId) return `payment_intent=${encodeURIComponent(paymentIntentId)}`;
    if (sessionId) return `session_id=${encodeURIComponent(sessionId)}`;
    return null;
  }, [paymentIntentId, sessionId]);

  useEffect(() => {
    if (!statusLookupQuery) return;
    let cancelled = false;
    const controller = new AbortController();

    const loadStatus = async () => {
      try {
        setStripeLoading(true);
        const response = await fetch(
          `${API_BASE}/api/stripe/order-status?${statusLookupQuery}`,
          { signal: controller.signal }
        );
        const data = await response.json();
        if (!cancelled) {
          setStripeStatus(response.ok ? data : { status: "unknown" });
        }
      } catch (error) {
        if (!cancelled) {
          setStripeStatus({ status: "unknown" });
        }
      } finally {
        if (!cancelled) setStripeLoading(false);
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_BASE, statusLookupQuery]);

  useEffect(() => {
    if (!order) return;
    const paymentSettled = stripeStatus?.status === "paid" || order.stripe?.status === "paid";
    if (!paymentSettled) return;
    if (purchaseTrackedRef.current === order.id) return;

    try {
      const lastTracked = window.localStorage.getItem(PURCHASE_EVENT_CACHE_KEY);
      if (lastTracked === order.id) return;
    } catch {
      // ignore read failures
    }

    trackPurchase(
      order.id,
      order.items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
      order.total
    );
    trackConversionEventOnce(`checkout_completed:${order.id}`, "checkout_completed", {
      orderId: order.id,
    });
    purchaseTrackedRef.current = order.id;

    try {
      window.localStorage.setItem(PURCHASE_EVENT_CACHE_KEY, order.id);
    } catch {
      // ignore write failures
    }
  }, [order, stripeStatus?.status]);

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <NotificationBar />
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="rounded-2xl border bg-card p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No order found
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold uppercase">
              Confirmation Missing
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Place an order from checkout to generate a confirmation summary.
            </p>
            <Link
              to="/checkout"
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-foreground bg-foreground px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
              Back to Checkout
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const created = new Date(order.createdAt);
  const createdLabel = created.toLocaleString();
  const printifyOrderId = stripeStatus?.printifyOrderId ?? order.printify?.orderId ?? null;
  const paymentStatusLabel = stripeLoading
    ? "Payment verifying"
    : stripeStatus?.status === "paid"
      ? "Payment confirmed"
      : stripeStatus?.status === "pending"
        ? "Payment pending"
        : "Payment status pending";
  const showPaymentDebugIds =
    import.meta.env.DEV || import.meta.env.VITE_SHOW_PAYMENT_DEBUG_IDS === "true";
  const paymentMethodLabel =
    order.paymentMethod === "stripe_payment_element"
      ? "Stripe Payment Element"
      : order.paymentMethod === "stripe"
        ? "Stripe Checkout"
        : order.paymentMethod.toUpperCase();
  const shippingMethodLabel = /express|priority/i.test(order.shippingMethod)
    ? "Express shipping"
    : "Standard shipping";

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-2xl border bg-card p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_70%)]" />
          <div className="relative">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Order Confirmed
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight">
              Drop Locked In
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your order is queued. We will send the production and shipping updates by email.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="rounded-md border bg-background/40 px-3 py-1">
                Order {order.id}
              </span>
              {printifyOrderId ? (
                <span className="rounded-md border bg-background/40 px-3 py-1">
                  Fulfillment {printifyOrderId}
                </span>
              ) : null}
              <span className="rounded-md border bg-background/40 px-3 py-1">
                {paymentStatusLabel}
              </span>
              <span className="rounded-md border bg-background/40 px-3 py-1">
                Placed {createdLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border bg-card p-6">
            <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Items
            </div>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.variantKey} className="flex justify-between gap-4 text-sm">
                  <div>
                    <div className="font-heading text-sm font-bold uppercase tracking-wide">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {[
                        item.size && `Size ${item.size}`,
                        item.color && `Color ${item.color}`,
                        `Qty ${item.quantity}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="font-mono text-forum-gold">
                    {formatMoney(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6">
              <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Shipping
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                <div>{order.contact.firstName} {order.contact.lastName}</div>
                <div>{order.shipping.address}</div>
                <div>
                  {order.shipping.city}, {order.shipping.region} {order.shipping.postal}
                </div>
                <div>{order.shipping.country}</div>
              </div>
              <div className="mt-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Method: {shippingMethodLabel}
              </div>
              <div className="mt-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Delivery estimate: {order.estimatedDelivery ?? "Pending"}
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Payment
              </div>
              <div className="mt-3 text-sm text-muted-foreground">
                Method: {paymentMethodLabel}
              </div>
              <div className="mt-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Status: {paymentStatusLabel}
              </div>
              {showPaymentDebugIds && paymentIntentId ? (
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Payment Intent {paymentIntentId}
                </div>
              ) : showPaymentDebugIds && sessionId ? (
                <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Session {sessionId}
                </div>
              ) : null}
              {stripeStatus?.printifyError ? (
                <div className="mt-3 text-[11px] text-forum-red">
                  Fulfillment is still processing. We will email tracking details as soon as it updates.
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Summary
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-forum-gold">{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono text-muted-foreground">
                    {order.shippingCost ? formatMoney(order.shippingCost) : "Included"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-mono text-muted-foreground">{formatMoney(order.tax)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-mono text-forum-gold">{formatMoney(order.total)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center rounded-lg border border-foreground bg-foreground px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
              >
                Continue Shopping
              </Link>
              <Link
                to="/shop"
                className="mt-3 block text-center text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Back to Shop
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Confirmation;

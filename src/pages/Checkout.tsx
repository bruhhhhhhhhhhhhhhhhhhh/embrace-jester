import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Elements,
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCartState } from "@/components/cart/cart";
import { formatMoney } from "@/lib/money";
import { saveOrder, type OrderSummary } from "@/lib/order";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "@/components/ui/sonner";
import { trackAddPaymentInfo, trackBeginCheckout } from "@/lib/analytics";
import { trackConversionEventOnce } from "@/lib/conversion";

const TAX_BY_STATE: Record<string, number> = {
  CA: 0.0825,
  NY: 0.08875,
  TX: 0.0825,
  FL: 0.06,
  IL: 0.0625,
  WA: 0.065,
  NJ: 0.06625,
  MA: 0.0625,
};
const ZIP_PREFIX_RATE: Record<string, number> = {
  "0": 0.065,
  "1": 0.07,
  "2": 0.0725,
  "3": 0.075,
  "4": 0.07,
  "5": 0.075,
  "6": 0.0775,
  "7": 0.0675,
  "8": 0.07,
  "9": 0.0825,
};

type PrintifyLineItem = {
  productId: string;
  variantId: number;
  quantity: number;
};

type ShippingAddressTo = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  region: string;
  zip: string;
  country: string;
};

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = STRIPE_PUBLISHABLE_KEY ? loadStripe(STRIPE_PUBLISHABLE_KEY) : null;

type StripePaymentFormProps = {
  totalLabel: string;
  contact: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  onSuccess: (paymentIntent: { id: string; status: string }) => void;
  onError: (message: string) => void;
};

const StripePaymentForm = ({ totalLabel, contact, onSuccess, onError }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const confirmCurrentPayment = async () => {
    if (!stripe || !elements) return;
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
        payment_method_data: {
          billing_details: {
            name: `${contact.firstName} ${contact.lastName}`.trim(),
            email: contact.email,
            phone: contact.phone || undefined,
          },
        },
      },
    });

    if (result.error) {
      onError(result.error.message ?? "Payment failed. Please check your details.");
      return;
    }

    if (result.paymentIntent) {
      onSuccess(result.paymentIntent);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    await confirmCurrentPayment();
    setSubmitting(false);
  };

  const handleExpressConfirm = async (_event: unknown) => {
    if (!stripe || !elements || submitting) return;
    setSubmitting(true);
    await confirmCurrentPayment();
    setSubmitting(false);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="border border-border bg-background p-4">
        <div className="text-xs font-mono uppercase tracking-[0.24em] text-foreground">
          Express Checkout
        </div>
        <div className="mt-3">
          <ExpressCheckoutElement
            onConfirm={handleExpressConfirm}
            options={{
              layout: { maxColumns: 2, maxRows: 2 },
              buttonHeight: 44,
            }}
          />
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Apple Pay, Google Pay, and Link are shown when available.
        </p>
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span className="h-px flex-1 bg-border/70" />
        <span>or card</span>
        <span className="h-px flex-1 bg-border/70" />
      </div>
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        className="w-full border border-foreground bg-foreground px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        type="submit"
        disabled={!stripe || !elements || submitting}
      >
        {submitting ? "Processing..." : `Secure Order • ${totalLabel}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const { items, count, subtotal } = useCartState();
  const inputClass =
    "border border-border bg-background px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground";
  const API_BASE =
    import.meta.env.VITE_PRINTIFY_API_BASE ?? "http://localhost:3031";
  const paymentMethod = "stripe_payment_element";
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">("standard");
  const [shippingQuote, setShippingQuote] = useState<Record<string, number> | null>(null);
  const [shippingStatus, setShippingStatus] = useState<"idle" | "loading" | "error">("idle");
  const [debouncedQuoteKey, setDebouncedQuoteKey] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string | null>(null);
  const [stripeInitError, setStripeInitError] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<OrderSummary | null>(null);
  const quoteCacheRef = useRef(new Map<string, Record<string, number>>());
  const beginCheckoutTrackedRef = useRef<string | null>(null);
  const addPaymentInfoTrackedRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    region: "",
    postal: "",
    country: "",
  });

  const estimateTaxRate = useMemo(() => {
    const region = form.region.trim().toUpperCase();
    if (region && TAX_BY_STATE[region]) return TAX_BY_STATE[region];
    const zip = form.postal.trim();
    const prefix = zip[0];
    if (prefix && ZIP_PREFIX_RATE[prefix]) return ZIP_PREFIX_RATE[prefix];
    return 0.07;
  }, [form.region, form.postal]);

  const updateField =
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    };

  const isEmailValid = form.email ? /\S+@\S+\.\S+/.test(form.email) : false;
  const isAddressValid = useMemo(
    () =>
      Boolean(
        form.firstName &&
          form.lastName &&
          isEmailValid &&
          form.address &&
          form.city &&
          form.region &&
          form.postal &&
          form.country
      ),
    [form, isEmailValid]
  );

  const printifyLineItems = useMemo<PrintifyLineItem[]>(
    () =>
      items
        .filter((item) => item.printify?.variantId)
        .map((item) => ({
          productId: item.printify?.productId ?? item.id,
          variantId: item.printify?.variantId as number,
          quantity: item.quantity,
        })),
    [items]
  );

  const analyticsItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
    [items]
  );

  const beginCheckoutSignature = useMemo(
    () =>
      JSON.stringify(
        analyticsItems.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
        }))
      ),
    [analyticsItems]
  );

  const addressTo = useMemo<ShippingAddressTo>(
    () => ({
      first_name: form.firstName,
      last_name: form.lastName,
      email: form.email,
      phone: form.phone || "",
      address1: form.address,
      city: form.city,
      region: form.region,
      zip: form.postal,
      country: form.country,
    }),
    [form]
  );

  const canQuoteShipping =
    isAddressValid && printifyLineItems.length && printifyLineItems.length === items.length;

  const quotePayload = useMemo(
    () =>
      canQuoteShipping
        ? {
            lineItems: printifyLineItems,
            addressTo,
          }
        : null,
    [addressTo, canQuoteShipping, printifyLineItems]
  );

  const quoteKey = useMemo(
    () => (quotePayload ? JSON.stringify(quotePayload) : ""),
    [quotePayload]
  );

  useEffect(() => {
    if (!quoteKey) {
      setDebouncedQuoteKey("");
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedQuoteKey(quoteKey);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [quoteKey]);

  useEffect(() => {
    if (!debouncedQuoteKey) {
      setShippingQuote(null);
      setShippingStatus("idle");
      return;
    }

    const cached = quoteCacheRef.current.get(debouncedQuoteKey);
    if (cached) {
      setShippingQuote(cached);
      setShippingStatus("idle");
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadQuote = async () => {
      try {
        setShippingStatus("loading");
        const payload = JSON.parse(debouncedQuoteKey) as {
          lineItems: PrintifyLineItem[];
          addressTo: ShippingAddressTo;
        };
        const response = await fetch(`${API_BASE}/api/printify/shipping`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || "Shipping quote failed");
        }
        if (!cancelled) {
          quoteCacheRef.current.set(debouncedQuoteKey, data);
          setShippingQuote(data);
          setShippingStatus("idle");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (!cancelled) {
          setShippingQuote(null);
          setShippingStatus("error");
        }
      }
    };

    loadQuote();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [API_BASE, debouncedQuoteKey]);

  const shippingCost = useMemo(() => {
    if (shippingQuote) {
      const expressRate =
        shippingQuote.printify_express ??
        shippingQuote.priority ??
        shippingQuote.express;
      const standardRate = shippingQuote.standard ?? shippingQuote.economy;
      const cents = shippingMethod === "express" ? expressRate : standardRate;
      if (typeof cents === "number") {
        return cents / 100;
      }
    }
    if (shippingMethod === "express") return subtotal >= 200 ? 0 : 18;
    return subtotal >= 100 ? 0 : 8;
  }, [shippingMethod, shippingQuote, subtotal]);

  const shippingMethodKey = useMemo(() => {
    if (shippingMethod === "express") {
      if (shippingQuote?.printify_express != null) return "printify_express";
      if (shippingQuote?.priority != null) return "priority";
      return "express";
    }
    if (shippingQuote?.economy != null) return "economy";
    return "standard";
  }, [shippingMethod, shippingQuote]);

  const tax = useMemo(() => subtotal * estimateTaxRate, [subtotal, estimateTaxRate]);
  const total = useMemo(() => subtotal + shippingCost + tax, [subtotal, shippingCost, tax]);

  const standardRate = shippingQuote?.standard ?? shippingQuote?.economy;
  const expressRate =
    shippingQuote?.printify_express ?? shippingQuote?.priority ?? shippingQuote?.express;
  const standardRateLabel =
    typeof standardRate === "number"
      ? formatMoney(standardRate / 100)
      : subtotal >= 100
        ? "Included"
        : "$8.00";
  const expressRateLabel =
    typeof expressRate === "number"
      ? formatMoney(expressRate / 100)
      : subtotal >= 200
        ? "Included"
        : "$18.00";

  const isDomestic = useMemo(() => {
    const country = form.country.trim().toLowerCase();
    if (!country) return true;
    return ["us", "usa", "united states", "united states of america"].includes(country);
  }, [form.country]);

  const deliveryWindow = useMemo(() => {
    const base = shippingMethod === "express" ? [2, 3] : [4, 6];
    const zip = form.postal.trim();
    const offset =
      zip.startsWith("9") || zip.startsWith("0")
        ? 1
        : zip.startsWith("6") || zip.startsWith("7")
          ? 0
          : 0;
    const internationalOffset = isDomestic ? 0 : 4;
    const min = base[0] + offset + internationalOffset;
    const max = base[1] + offset + internationalOffset + (isDomestic ? 0 : 3);
    return { min, max };
  }, [shippingMethod, form.postal, isDomestic]);

  const deliveryLabel = useMemo(() => {
    if (!form.postal.trim()) return "Enter postal to estimate";
    const now = new Date();
    const format = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });
    const minDate = new Date(now);
    const maxDate = new Date(now);
    minDate.setDate(minDate.getDate() + deliveryWindow.min);
    maxDate.setDate(maxDate.getDate() + deliveryWindow.max);
    return `${format.format(minDate)} - ${format.format(maxDate)}`;
  }, [deliveryWindow, form.postal]);

  const shippingLabel = shippingMethod === "express" ? "Express 1-2 Days" : "Standard 3-6 Days";

  const stripeConfigured = Boolean(stripePromise);
  const printifyPayload = useMemo(
    () =>
      printifyLineItems.length === items.length
        ? {
            lineItems: printifyLineItems,
            addressTo,
            shippingMethod: shippingMethodKey,
          }
        : undefined,
    [addressTo, items.length, printifyLineItems, shippingMethodKey]
  );

  const orderFingerprint = useMemo(
    () =>
      JSON.stringify({
        items: items.map((item) => ({
          variantKey: item.variantKey,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color,
        })),
        subtotal,
        shippingCost,
        tax,
        total,
        shippingMethodKey,
        contact: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
        },
        shipping: {
          address: form.address,
          city: form.city,
          region: form.region,
          postal: form.postal,
          country: form.country,
        },
        estimatedDelivery: deliveryLabel,
      }),
    [deliveryLabel, form, items, shippingCost, shippingMethodKey, subtotal, tax, total]
  );

  useEffect(() => {
    setStripeClientSecret(null);
    setStripePaymentIntentId(null);
    setStripeInitError(null);
    setPendingOrder(null);
    addPaymentInfoTrackedRef.current = null;
  }, [orderFingerprint]);

  useEffect(() => {
    if (!analyticsItems.length) return;
    if (beginCheckoutTrackedRef.current === beginCheckoutSignature) return;
    trackBeginCheckout(analyticsItems, total);
    trackConversionEventOnce(`checkout_started:${beginCheckoutSignature}`, "checkout_started");
    beginCheckoutTrackedRef.current = beginCheckoutSignature;
  }, [analyticsItems, beginCheckoutSignature, total]);

  const initializeStripePayment = async () => {
    if (!isAddressValid || placingOrder) return;
    if (!stripeConfigured) {
      setStripeInitError("Stripe publishable key is missing. Set VITE_STRIPE_PUBLISHABLE_KEY.");
      return;
    }

    setPlacingOrder(true);
    setStripeInitError(null);

    const orderPayload: OrderSummary = {
      id: `LMX-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      items,
      subtotal,
      shippingCost,
      tax,
      total,
      paymentMethod,
      shippingMethod: shippingMethodKey,
      contact: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
      },
      shipping: {
        address: form.address,
        city: form.city,
        region: form.region,
        postal: form.postal,
        country: form.country,
      },
      estimatedDelivery: deliveryLabel,
    };

    try {
      const response = await fetch(`${API_BASE}/api/stripe/payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: orderPayload,
          printify: printifyPayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data?.clientSecret || !data?.paymentIntentId) {
        throw new Error(data?.error || "Unable to initialize Stripe payment.");
      }

      setPendingOrder(orderPayload);
      setStripeClientSecret(data.clientSecret);
      setStripePaymentIntentId(data.paymentIntentId);
      if (addPaymentInfoTrackedRef.current !== orderFingerprint) {
        trackAddPaymentInfo(analyticsItems, total, "stripe");
        addPaymentInfoTrackedRef.current = orderFingerprint;
      }
      saveOrder({
        ...orderPayload,
        stripe: {
          sessionId: data.paymentIntentId,
          paymentIntentId: data.paymentIntentId,
          status: "pending",
          paymentStatus: data.paymentStatus ?? "requires_payment_method",
        },
      });
      toast("Secure payment form loaded.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start Stripe payment. Please retry.";
      setStripeInitError(message);
      toast(message);
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleStripeSuccess = (paymentIntent: { id: string; status: string }) => {
    if (!pendingOrder) return;
    const status = paymentIntent.status === "succeeded" ? "paid" : "pending";
    saveOrder({
      ...pendingOrder,
      stripe: {
        sessionId: paymentIntent.id,
        paymentIntentId: paymentIntent.id,
        status,
        paymentStatus: paymentIntent.status,
      },
    });
    navigate(`/confirmation?payment_intent=${paymentIntent.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="border border-border bg-card p-6 md:p-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Checkout
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.12em]">
              Secure Order
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Enter shipping and payment details to complete the order.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <span className="border border-border bg-background px-3 py-1">1 Cart</span>
              <span className="border border-foreground bg-foreground px-3 py-1 text-background">
                2 Shipping
              </span>
              <span className="border border-border bg-background px-3 py-1">3 Payment</span>
            </div>
          </div>
        </div>

        {!items.length ? (
          <div className="mt-8 border border-border bg-card p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              No items selected
            </p>
            <h2 className="mt-3 font-heading text-2xl font-bold uppercase tracking-[0.12em]">
              Cart Is Empty
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Add items to your cart before checkout.
            </p>
            <Link
              className="mt-6 inline-flex items-center justify-center border border-foreground bg-foreground px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground"
              to="/shop"
            >
              View Collection
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-6">
              <div className="border border-border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Contact
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClass}
                    placeholder="First name"
                    value={form.firstName}
                    onChange={updateField("firstName")}
                  />
                  <input
                    className={inputClass}
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={updateField("lastName")}
                  />
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    placeholder="Email"
                    type="email"
                    value={form.email}
                    onChange={updateField("email")}
                  />
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    placeholder="Phone (optional)"
                    value={form.phone}
                    onChange={updateField("phone")}
                  />
                </div>
              </div>

              <div className="border border-border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Shipping
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <input
                    className={`${inputClass} sm:col-span-2`}
                    placeholder="Address"
                    value={form.address}
                    onChange={updateField("address")}
                  />
                  <input
                    className={inputClass}
                    placeholder="City"
                    value={form.city}
                    onChange={updateField("city")}
                  />
                  <input
                    className={inputClass}
                    placeholder="State / Province"
                    value={form.region}
                    onChange={updateField("region")}
                  />
                  <input
                    className={inputClass}
                    placeholder="Zip / Postal"
                    value={form.postal}
                    onChange={updateField("postal")}
                  />
                  <input
                    className={inputClass}
                    placeholder="Country"
                    value={form.country}
                    onChange={updateField("country")}
                  />
                </div>
                <div
                  className={`mt-4 border px-4 py-3 text-xs font-mono uppercase tracking-widest ${
                    isAddressValid
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {isAddressValid ? "Address verified" : "Complete shipping details"}
                </div>
                <div className="mt-3 border border-border bg-background px-4 py-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Estimated delivery: {deliveryLabel}
                </div>
                <div className="mt-6">
                  <div className="font-heading text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    Delivery Method
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setShippingMethod("standard")}
                      className={
                        shippingMethod === "standard"
                          ? "border border-foreground bg-foreground px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-background"
                          : "border border-border bg-background px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background"
                      }
                    >
                      Standard 3-6 Days
                      <span className="mt-2 block text-[10px] text-muted-foreground">
                        {standardRateLabel}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingMethod("express")}
                      className={
                        shippingMethod === "express"
                          ? "border border-foreground bg-foreground px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-background"
                          : "border border-border bg-background px-4 py-3 text-left text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background"
                      }
                    >
                      Express 1-2 Days
                      <span className="mt-2 block text-[10px] text-muted-foreground">
                        {expressRateLabel}
                      </span>
                    </button>
                  </div>
                  {shippingStatus === "loading" ? (
                    <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Syncing live shipping rates...
                    </p>
                  ) : shippingStatus === "error" ? (
                    <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-forum-red">
                      Live rates unavailable. Using fallback estimate.
                    </p>
                  ) : shippingQuote ? (
                    <p className="mt-3 text-[10px] font-mono uppercase tracking-widest text-foreground">
                      Live shipping rates applied.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="border border-border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Promo Code
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground"
                    placeholder="Enter code"
                  />
                  <button
                    className="border border-foreground bg-foreground px-4 py-2 text-xs font-mono font-semibold uppercase tracking-[0.22em] text-background opacity-60"
                    disabled
                  >
                    Apply
                  </button>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Promo codes are applied when available.
                </div>
              </div>

              <div className="border border-border bg-card p-6">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Payment
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stripe handles wallet and card payment. The order stays on-site until confirmation is required.
                </p>
                <div className="mt-4 border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-mono uppercase tracking-widest text-foreground">
                        Stripe Payment
                      </div>
                      <div className="mt-1 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                        Cards · Link · Apple Pay · Google Pay
                      </div>
                    </div>
                    <span className="border border-foreground bg-foreground px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-background">
                      Secure
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    3D Secure and bank verification will only redirect when required.
                  </p>
                  {!stripeConfigured ? (
                    <p className="mt-3 text-[11px] text-forum-red">
                      Missing Stripe publishable key. Set `VITE_STRIPE_PUBLISHABLE_KEY`.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="h-fit border border-border bg-card p-6 lg:sticky lg:top-24">
              <div className="flex items-center justify-between">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Order Summary
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {count} items
                </span>
              </div>
              <div className="mt-4 space-y-4 text-sm">
                {items.map((item) => {
                  const variantLabel = [
                    item.size && `Size ${item.size}`,
                    item.color && `Color ${item.color}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  return (
                    <div key={item.variantKey} className="flex gap-3">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden border border-border bg-background">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 text-muted-foreground">
                        <Link
                          to={`/product/${item.id}`}
                          className="transition-colors hover:text-foreground"
                        >
                          {item.name}
                        </Link>
                        <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Qty {item.quantity}
                          {variantLabel ? ` · ${variantLabel}` : ""}
                        </div>
                      </div>
                      <div className="font-mono text-foreground">
                        {formatMoney(item.price * item.quantity)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 border border-border bg-background p-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Shipping Method</span>
                  <span className="text-foreground">{shippingLabel}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Rate Source</span>
                  <span className="text-foreground">
                    {shippingQuote ? "Live carrier quote" : "Estimated"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Delivery Window</span>
                  <span className="text-foreground">{deliveryLabel}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Tracking</span>
                  <span className="text-foreground">Auto-updated</span>
                </div>
              </div>

              <div className="mt-4 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono text-foreground">{formatMoney(subtotal)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-mono text-muted-foreground">
                    {shippingCost ? formatMoney(shippingCost) : "Included"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Estimated tax ({Math.round(estimateTaxRate * 1000) / 10}%)
                  </span>
                  <span className="font-mono text-muted-foreground">{formatMoney(tax)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="text-muted-foreground">Estimated total</span>
                  <span className="font-mono text-foreground">{formatMoney(total)}</span>
                </div>
              </div>

              <div className="mt-4 border border-border bg-background p-4 text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                <div className="text-foreground">Order Notes</div>
                <ul className="mt-2 space-y-1">
                  <li>Secure checkout and encrypted payment</li>
                  <li>Shipping and tax are confirmed before payment</li>
                  <li>Exchange support is available after delivery</li>
                </ul>
              </div>

              {!stripeClientSecret ? (
                <button
                  className="mt-5 w-full border border-foreground bg-foreground px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!isAddressValid || placingOrder || !stripeConfigured}
                  onClick={initializeStripePayment}
                  type="button"
                >
                  {placingOrder ? "Loading Payment..." : "Continue To Payment"}
                </button>
              ) : stripePromise ? (
                <div className="mt-5 space-y-3">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: {
                        theme: "night",
                        variables: {
                          colorPrimary: "#f5f5f5",
                          colorBackground: "#050505",
                          colorText: "#f5f5f5",
                          colorDanger: "#dc2626",
                          borderRadius: "0px",
                        },
                      },
                    }}
                  >
                    <StripePaymentForm
                      totalLabel={formatMoney(total)}
                      contact={{
                        email: form.email,
                        firstName: form.firstName,
                        lastName: form.lastName,
                        phone: form.phone || undefined,
                      }}
                      onSuccess={handleStripeSuccess}
                      onError={(message) => {
                        toast(message);
                      }}
                    />
                  </Elements>
                  {stripePaymentIntentId ? (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Payment intent {stripePaymentIntentId}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {stripeInitError ? (
                <p className="mt-3 text-xs text-forum-red">{stripeInitError}</p>
              ) : null}

              <Link
                className="mt-4 block text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:text-foreground"
                to="/cart"
              >
                Return To Cart
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;

import { FormEvent, useCallback, useEffect, useState } from "react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import NotificationBar from "@/components/NotificationBar";
import { apiFetch } from "@/lib/api";

type WebhookLogStatus = "processed" | "ignored" | "duplicate" | "failed";

type WebhookEventEntry = {
  eventId: string;
  eventType: string;
  receivedAt: string;
  processedAt: string;
  status: WebhookLogStatus;
  handled: boolean;
  processed: boolean;
  duplicate: boolean;
  note?: string;
  orderId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceId?: string;
};

type DeadLetterEntry = {
  eventId: string;
  eventType: string;
  attempts: number;
  firstFailedAt: string;
  lastFailedAt: string;
  nextRetryAt: string;
  lastError: string;
  orderId?: string;
  paymentIntentId?: string;
  sessionId?: string;
  customerId?: string;
  subscriptionId?: string;
  invoiceId?: string;
};

type WebhookEventsResponse = {
  total: number;
  returned: number;
  limit: number;
  filters: {
    status: WebhookLogStatus | null;
    type: string | null;
  };
  counts: {
    byStatus: Record<WebhookLogStatus, number>;
    stripeEventCacheSize: number;
    deadLetters: {
      total: number;
      due: number;
    };
    billing: {
      customers: number;
      subscriptions: number;
      invoices: number;
    };
  };
  deadLetters: DeadLetterEntry[];
  events: WebhookEventEntry[];
};

type DeadLetterRetryResponse = {
  ok: true;
  requested: number;
  replayed: number;
  failed: number;
  skipped: number;
  remainingDeadLetters: number;
  results: Array<{
    eventId: string;
    eventType: string;
    status: "processed" | "ignored" | "failed" | "skipped";
    note?: string;
  }>;
};

type SubscriptionSummary = {
  id: string;
  status: string;
  customerId: string | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: string | null;
  canceledAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
};

type SubscriptionInvoiceSummary = {
  id: string;
  status: string | null;
  paid: boolean;
  amountDue: number;
  amountPaid: number;
  currency: string | null;
};

type SubscriptionLookupResponse = {
  ok: true;
  subscription: SubscriptionSummary;
  latestInvoice: SubscriptionInvoiceSummary | null;
  paymentIntentClientSecret: string | null;
};

type SubscriptionManageResponse = {
  ok: true;
  action: "cancel" | "resume" | "cancel_now";
  subscription: SubscriptionSummary;
};

const STATUS_OPTIONS: Array<{ value: "" | WebhookLogStatus; label: string }> = [
  { value: "", label: "All" },
  { value: "processed", label: "Processed" },
  { value: "ignored", label: "Ignored" },
  { value: "duplicate", label: "Duplicate" },
  { value: "failed", label: "Failed" },
];

const asLocalDateTime = (value: string | null | undefined) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatMoney = (minorAmount: number, currency: string | null | undefined) => {
  const normalizedCurrency = (currency ?? "usd").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
    }).format((minorAmount ?? 0) / 100);
  } catch {
    return `${((minorAmount ?? 0) / 100).toFixed(2)} ${normalizedCurrency}`;
  }
};

const StripeWebhookQA = () => {
  const [filters, setFilters] = useState<{
    status: "" | WebhookLogStatus;
    type: string;
    limit: number;
  }>({ status: "", type: "", limit: 100 });
  const [draftFilters, setDraftFilters] = useState(filters);
  const [data, setData] = useState<WebhookEventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryBusy, setRetryBusy] = useState("");
  const [retryReport, setRetryReport] = useState<DeadLetterRetryResponse | null>(null);

  const [lookupSubscriptionId, setLookupSubscriptionId] = useState("");
  const [manageSubscriptionId, setManageSubscriptionId] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionLookupResponse | null>(null);
  const [subscriptionBusy, setSubscriptionBusy] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [createForm, setCreateForm] = useState({
    priceId: "",
    customerId: "",
    customerEmail: "",
    customerName: "",
    paymentMethodId: "",
    trialPeriodDays: "",
    quantity: "1",
    metadataJson: "",
  });

  const loadWebhookData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.type.trim()) params.set("type", filters.type.trim());
      params.set("limit", String(filters.limit));
      const query = params.toString();
      const next = await apiFetch<WebhookEventsResponse>(
        `/api/stripe/webhook-events${query ? `?${query}` : ""}`
      );
      setData(next);
    } catch (requestError) {
      setError((requestError as Error).message || "Failed to load webhook events.");
    } finally {
      setLoading(false);
    }
  }, [filters.limit, filters.status, filters.type]);

  useEffect(() => {
    void loadWebhookData();
  }, [loadWebhookData]);

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFilters({
      ...draftFilters,
      type: draftFilters.type.trim(),
    });
  };

  const retryDeadLetters = async (
    label: string,
    payload: { eventId?: string; limit?: number; force?: boolean }
  ) => {
    setRetryBusy(label);
    setError("");
    try {
      const result = await apiFetch<DeadLetterRetryResponse>("/api/stripe/webhook-dead-letter/retry", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setRetryReport(result);
      await loadWebhookData();
    } catch (requestError) {
      setError((requestError as Error).message || "Dead-letter retry failed.");
    } finally {
      setRetryBusy("");
    }
  };

  const loadSubscription = async (subscriptionId: string) => {
    const trimmed = subscriptionId.trim();
    if (!trimmed) {
      setSubscriptionError("Subscription id is required.");
      return;
    }
    setSubscriptionBusy("lookup");
    setSubscriptionError("");
    setSubscriptionMessage("");
    try {
      const result = await apiFetch<SubscriptionLookupResponse>(
        `/api/stripe/subscriptions?id=${encodeURIComponent(trimmed)}`
      );
      setSubscriptionData(result);
      setManageSubscriptionId(result.subscription.id);
      setLookupSubscriptionId(result.subscription.id);
      setSubscriptionMessage("Subscription loaded.");
    } catch (requestError) {
      setSubscriptionError((requestError as Error).message || "Failed to load subscription.");
    } finally {
      setSubscriptionBusy("");
    }
  };

  const createSubscription = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const priceId = createForm.priceId.trim();
    if (!priceId) {
      setSubscriptionError("priceId is required.");
      return;
    }

    let metadata: Record<string, unknown> | undefined;
    const metadataRaw = createForm.metadataJson.trim();
    if (metadataRaw) {
      try {
        const parsed = JSON.parse(metadataRaw) as Record<string, unknown>;
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Metadata must be a JSON object.");
        }
        metadata = parsed;
      } catch (requestError) {
        setSubscriptionError(
          (requestError as Error).message || "metadataJson must be valid JSON."
        );
        return;
      }
    }

    const payload: Record<string, unknown> = { priceId };
    if (createForm.customerId.trim()) payload.customerId = createForm.customerId.trim();
    if (createForm.customerEmail.trim()) payload.customerEmail = createForm.customerEmail.trim();
    if (createForm.customerName.trim()) payload.customerName = createForm.customerName.trim();
    if (createForm.paymentMethodId.trim()) payload.paymentMethodId = createForm.paymentMethodId.trim();
    if (createForm.trialPeriodDays.trim()) {
      payload.trialPeriodDays = Number(createForm.trialPeriodDays);
    }
    if (createForm.quantity.trim()) {
      payload.quantity = Number(createForm.quantity);
    }
    if (metadata) payload.metadata = metadata;

    setSubscriptionBusy("create");
    setSubscriptionError("");
    setSubscriptionMessage("");
    try {
      const result = await apiFetch<SubscriptionLookupResponse>("/api/stripe/subscriptions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubscriptionData(result);
      setLookupSubscriptionId(result.subscription.id);
      setManageSubscriptionId(result.subscription.id);
      setSubscriptionMessage("Subscription created.");
    } catch (requestError) {
      setSubscriptionError((requestError as Error).message || "Failed to create subscription.");
    } finally {
      setSubscriptionBusy("");
    }
  };

  const manageSubscription = async (action: "cancel" | "resume" | "cancel_now") => {
    const subscriptionId =
      manageSubscriptionId.trim() || subscriptionData?.subscription.id || lookupSubscriptionId.trim();
    if (!subscriptionId) {
      setSubscriptionError("Subscription id is required for manage actions.");
      return;
    }
    setSubscriptionBusy(action);
    setSubscriptionError("");
    setSubscriptionMessage("");
    try {
      const result = await apiFetch<SubscriptionManageResponse>("/api/stripe/subscriptions/manage", {
        method: "POST",
        body: JSON.stringify({ subscriptionId, action }),
      });
      setSubscriptionMessage(`Manage action applied: ${result.action}.`);
      await loadSubscription(subscriptionId);
    } catch (requestError) {
      setSubscriptionError((requestError as Error).message || "Failed to manage subscription.");
    } finally {
      setSubscriptionBusy("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto space-y-8 px-4 py-12">
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Stripe QA
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">
                Webhook Events and Dead Letters
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Inspect webhook processing, replay dead letters, and run subscription lifecycle tests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadWebhookData()}
              className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
              disabled={loading}
            >
              Refresh
            </button>
          </div>

          {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading webhook data...</p> : null}
          {error ? <p className="mt-6 text-sm text-forum-red">{error}</p> : null}

          {data ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Processed
                  </p>
                  <p className="mt-2 font-heading text-2xl">{data.counts.byStatus.processed}</p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Ignored
                  </p>
                  <p className="mt-2 font-heading text-2xl">{data.counts.byStatus.ignored}</p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Duplicate
                  </p>
                  <p className="mt-2 font-heading text-2xl">{data.counts.byStatus.duplicate}</p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Failed
                  </p>
                  <p className="mt-2 font-heading text-2xl">{data.counts.byStatus.failed}</p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Dead Letters
                  </p>
                  <p className="mt-2 font-heading text-2xl">{data.counts.deadLetters.total}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due now: {data.counts.deadLetters.due}
                  </p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Billing Snapshots
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {data.counts.billing.customers} customers
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.counts.billing.subscriptions} subscriptions
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.counts.billing.invoices} invoices
                  </p>
                </div>
              </div>

              <form
                className="grid gap-3 rounded-xl border bg-background/40 p-4 md:grid-cols-4"
                onSubmit={applyFilters}
              >
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Status
                  <select
                    className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                    value={draftFilters.status}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        status: event.target.value as "" | WebhookLogStatus,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.label} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Event Type
                  <input
                    value={draftFilters.type}
                    onChange={(event) =>
                      setDraftFilters((current) => ({ ...current, type: event.target.value }))
                    }
                    placeholder="invoice.payment_failed"
                    className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                  />
                </label>
                <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Limit
                  <select
                    className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                    value={draftFilters.limit}
                    onChange={(event) =>
                      setDraftFilters((current) => ({
                        ...current,
                        limit: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                    <option value={500}>500</option>
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
                  >
                    Apply Filters
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-background/40 p-4">
                <button
                  type="button"
                  disabled={retryBusy.length > 0}
                  onClick={() => void retryDeadLetters("retry_due", { limit: 50 })}
                  className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                >
                  Retry Due Dead Letters
                </button>
                <button
                  type="button"
                  disabled={retryBusy.length > 0}
                  onClick={() => void retryDeadLetters("retry_all", { limit: 50, force: true })}
                  className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                >
                  Retry All Dead Letters
                </button>
                {retryReport ? (
                  <p className="text-xs text-muted-foreground">
                    Replay summary: requested {retryReport.requested}, replayed {retryReport.replayed},
                    failed {retryReport.failed}, skipped {retryReport.skipped}, remaining{" "}
                    {retryReport.remainingDeadLetters}
                  </p>
                ) : null}
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide">
                  Dead-Letter Queue
                </h2>
                {data.deadLetters.length ? (
                  <div className="mt-3 max-h-72 overflow-auto rounded-lg border">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-secondary/60">
                        <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          <th className="px-3 py-2">Event</th>
                          <th className="px-3 py-2">Attempts</th>
                          <th className="px-3 py-2">Next Retry</th>
                          <th className="px-3 py-2">Last Error</th>
                          <th className="px-3 py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.deadLetters.map((entry) => (
                          <tr key={entry.eventId} className="border-t">
                            <td className="px-3 py-2">
                              <p className="font-mono text-[10px] uppercase tracking-widest">
                                {entry.eventType}
                              </p>
                              <p className="text-muted-foreground">{entry.eventId}</p>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">{entry.attempts}</td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {asLocalDateTime(entry.nextRetryAt)}
                            </td>
                            <td className="max-w-[420px] truncate px-3 py-2 text-muted-foreground">
                              {entry.lastError}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                disabled={retryBusy.length > 0}
                                onClick={() =>
                                  void retryDeadLetters(`retry_${entry.eventId}`, {
                                    eventId: entry.eventId,
                                    force: true,
                                    limit: 1,
                                  })
                                }
                                className="rounded-md border px-2 py-1 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                              >
                                Retry Now
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No dead-letter entries.</p>
                )}
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide">
                  Recent Webhook Log
                </h2>
                {data.events.length ? (
                  <div className="mt-3 max-h-[26rem] overflow-auto rounded-lg border">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-secondary/60">
                        <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          <th className="px-3 py-2">Time</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Event</th>
                          <th className="px-3 py-2">Refs</th>
                          <th className="px-3 py-2">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.events.map((entry) => (
                          <tr key={`${entry.eventId}-${entry.receivedAt}`} className="border-t">
                            <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                              {asLocalDateTime(entry.receivedAt)}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${
                                  entry.status === "failed"
                                    ? "bg-forum-red/20 text-forum-red"
                                    : entry.status === "processed"
                                      ? "bg-green-500/20 text-green-700"
                                      : "bg-secondary text-muted-foreground"
                                }`}
                              >
                                {entry.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-mono text-[10px] uppercase tracking-widest">
                                {entry.eventType}
                              </p>
                              <p className="text-muted-foreground">{entry.eventId}</p>
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {entry.orderId ? <p>Order: {entry.orderId}</p> : null}
                              {entry.paymentIntentId ? <p>PI: {entry.paymentIntentId}</p> : null}
                              {entry.subscriptionId ? <p>Sub: {entry.subscriptionId}</p> : null}
                              {entry.invoiceId ? <p>Inv: {entry.invoiceId}</p> : null}
                            </td>
                            <td className="max-w-[420px] truncate px-3 py-2 text-muted-foreground">
                              {entry.note || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No webhook log entries.</p>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Billing QA
          </p>
          <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight">
            Subscription Operations
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, fetch, and manage Stripe subscriptions with the server billing endpoints.
          </p>

          {subscriptionError ? <p className="mt-4 text-sm text-forum-red">{subscriptionError}</p> : null}
          {subscriptionMessage ? (
            <p className="mt-4 text-sm text-muted-foreground">{subscriptionMessage}</p>
          ) : null}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <form onSubmit={createSubscription} className="space-y-3 rounded-xl border bg-background/40 p-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">
                Create Subscription
              </h3>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Price ID
                <input
                  required
                  value={createForm.priceId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, priceId: event.target.value }))
                  }
                  placeholder="price_..."
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Customer ID (optional)
                <input
                  value={createForm.customerId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, customerId: event.target.value }))
                  }
                  placeholder="cus_..."
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Customer Email (required when customer id empty)
                <input
                  value={createForm.customerEmail}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, customerEmail: event.target.value }))
                  }
                  placeholder="customer@example.com"
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Customer Name
                <input
                  value={createForm.customerName}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, customerName: event.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Payment Method ID
                <input
                  value={createForm.paymentMethodId}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, paymentMethodId: event.target.value }))
                  }
                  placeholder="pm_..."
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Quantity
                  <input
                    value={createForm.quantity}
                    onChange={(event) =>
                      setCreateForm((current) => ({ ...current, quantity: event.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                  />
                </label>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Trial Days
                  <input
                    value={createForm.trialPeriodDays}
                    onChange={(event) =>
                      setCreateForm((current) => ({
                        ...current,
                        trialPeriodDays: event.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                  />
                </label>
              </div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Metadata JSON
                <textarea
                  value={createForm.metadataJson}
                  onChange={(event) =>
                    setCreateForm((current) => ({ ...current, metadataJson: event.target.value }))
                  }
                  placeholder='{"source":"qa"}'
                  rows={3}
                  className="mt-1 w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={subscriptionBusy.length > 0}
                className="rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
              >
                Create Subscription
              </button>
            </form>

            <div className="space-y-3 rounded-xl border bg-background/40 p-4">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wide">
                Fetch and Manage
              </h3>
              <div className="flex gap-2">
                <input
                  value={lookupSubscriptionId}
                  onChange={(event) => setLookupSubscriptionId(event.target.value)}
                  placeholder="sub_..."
                  className="w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
                />
                <button
                  type="button"
                  disabled={subscriptionBusy.length > 0}
                  onClick={() => void loadSubscription(lookupSubscriptionId)}
                  className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                >
                  Fetch
                </button>
              </div>

              <input
                value={manageSubscriptionId}
                onChange={(event) => setManageSubscriptionId(event.target.value)}
                placeholder="Manage subscription id"
                className="w-full rounded-md border border-border/70 bg-background px-2 py-2 text-xs text-foreground focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={subscriptionBusy.length > 0}
                  onClick={() => void manageSubscription("cancel")}
                  className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                >
                  Cancel At Period End
                </button>
                <button
                  type="button"
                  disabled={subscriptionBusy.length > 0}
                  onClick={() => void manageSubscription("resume")}
                  className="rounded-md border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors hover:bg-secondary/70 disabled:opacity-60"
                >
                  Resume
                </button>
                <button
                  type="button"
                  disabled={subscriptionBusy.length > 0}
                  onClick={() => void manageSubscription("cancel_now")}
                  className="rounded-md border border-forum-red px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-forum-red transition-colors hover:bg-forum-red/10 disabled:opacity-60"
                >
                  Cancel Immediately
                </button>
              </div>

              {subscriptionData ? (
                <div className="space-y-3 rounded-lg border bg-background p-3 text-xs">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Subscription
                    </p>
                    <p>ID: {subscriptionData.subscription.id}</p>
                    <p>Status: {subscriptionData.subscription.status}</p>
                    <p>Customer: {subscriptionData.subscription.customerId ?? "-"}</p>
                    <p>Cancel at period end: {subscriptionData.subscription.cancelAtPeriodEnd ? "yes" : "no"}</p>
                    <p>Current period start: {asLocalDateTime(subscriptionData.subscription.currentPeriodStart)}</p>
                    <p>Current period end: {asLocalDateTime(subscriptionData.subscription.currentPeriodEnd)}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Latest Invoice
                    </p>
                    {subscriptionData.latestInvoice ? (
                      <>
                        <p>ID: {subscriptionData.latestInvoice.id}</p>
                        <p>Status: {subscriptionData.latestInvoice.status ?? "-"}</p>
                        <p>Paid: {subscriptionData.latestInvoice.paid ? "yes" : "no"}</p>
                        <p>
                          Amount due:{" "}
                          {formatMoney(
                            subscriptionData.latestInvoice.amountDue,
                            subscriptionData.latestInvoice.currency
                          )}
                        </p>
                        <p>
                          Amount paid:{" "}
                          {formatMoney(
                            subscriptionData.latestInvoice.amountPaid,
                            subscriptionData.latestInvoice.currency
                          )}
                        </p>
                      </>
                    ) : (
                      <p>None</p>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      Payment Intent Client Secret
                    </p>
                    <p className="break-all text-muted-foreground">
                      {subscriptionData.paymentIntentClientSecret ?? "None returned"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fetch or create a subscription to display billing details.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default StripeWebhookQA;

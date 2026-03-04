import { useEffect, useState } from "react";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";

type FunnelResponse = {
  windowDays: number;
  generatedAt: string;
  totals: {
    heroImpressions: number;
    heroClicks: number;
    pdpViews: number;
    pdpAddToCart: number;
    checkoutStarted: number;
    checkoutCompleted: number;
  };
  rates: {
    heroCtr: number;
    pdpAddToCartRate: number;
    checkoutCompletionRate: number;
  };
  checkoutByDevice: Array<{
    device: "mobile" | "desktop";
    started: number;
    completed: number;
    completionRate: number;
  }>;
  recentEvents: Array<{
    id: string;
    event: string;
    timestamp: string;
    device: "mobile" | "desktop";
    path: string;
    productId?: string;
    orderId?: string;
  }>;
};

const pct = (value: number) => `${(value * 100).toFixed(1)}%`;

const ConversionQA = () => {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const next = await apiFetch<FunnelResponse>(`/api/analytics/funnel?days=${days}`);
        if (cancelled) return;
        setData(next);
      } catch (requestError) {
        if (cancelled) return;
        setError((requestError as Error).message || "Failed to load conversion data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Conversion QA
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">
                Pre-Ad Funnel Health
              </h1>
            </div>
            <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Window
              <select
                className="ml-3 rounded-md border border-border/70 bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
              </select>
            </label>
          </div>

          {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading...</p> : null}
          {error ? <p className="mt-6 text-sm text-forum-red">{error}</p> : null}

          {data ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Hero CTR
                  </p>
                  <p className="mt-2 font-heading text-2xl">{pct(data.rates.heroCtr)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.totals.heroClicks} clicks / {data.totals.heroImpressions} impressions
                  </p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    PDP Add-to-Cart
                  </p>
                  <p className="mt-2 font-heading text-2xl">{pct(data.rates.pdpAddToCartRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.totals.pdpAddToCart} adds / {data.totals.pdpViews} PDP views
                  </p>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Checkout Completion
                  </p>
                  <p className="mt-2 font-heading text-2xl">{pct(data.rates.checkoutCompletionRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data.totals.checkoutCompleted} complete / {data.totals.checkoutStarted} started
                  </p>
                </div>
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide">
                  Checkout Split By Device
                </h2>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-2">Device</th>
                        <th className="px-3 py-2">Started</th>
                        <th className="px-3 py-2">Completed</th>
                        <th className="px-3 py-2">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.checkoutByDevice.map((row) => (
                        <tr key={row.device} className="border-t">
                          <td className="px-3 py-2 font-mono uppercase text-muted-foreground">
                            {row.device}
                          </td>
                          <td className="px-3 py-2">{row.started}</td>
                          <td className="px-3 py-2">{row.completed}</td>
                          <td className="px-3 py-2">{pct(row.completionRate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border bg-background/40 p-4">
                <h2 className="font-heading text-sm font-bold uppercase tracking-wide">
                  Recent Conversion Events
                </h2>
                <div className="mt-3 max-h-72 overflow-auto rounded-lg border">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-secondary/60">
                      <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Event</th>
                        <th className="px-3 py-2">Device</th>
                        <th className="px-3 py-2">Path</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentEvents.map((event) => (
                        <tr key={event.id} className="border-t">
                          <td className="px-3 py-2 text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </td>
                          <td className="px-3 py-2 font-mono uppercase">{event.event}</td>
                          <td className="px-3 py-2 text-muted-foreground">{event.device}</td>
                          <td className="max-w-[380px] truncate px-3 py-2 text-muted-foreground">
                            {event.path || "/"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ConversionQA;

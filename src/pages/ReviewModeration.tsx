import { useEffect, useState } from "react";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { apiFetch } from "@/lib/api";

type ModerationReview = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  status: "pending" | "published" | "rejected";
  rejectedReason?: string;
};

type ModerationResponse = {
  pending: ModerationReview[];
  recent: ModerationReview[];
  counts: {
    pending: number;
    published: number;
    rejected: number;
  };
};

const ReviewModeration = () => {
  const [data, setData] = useState<ModerationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const next = await apiFetch<ModerationResponse>("/api/reviews/moderation");
      setData(next);
    } catch (requestError) {
      setError((requestError as Error).message || "Failed to load moderation queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const moderate = async (reviewId: string, action: "publish" | "reject") => {
    setBusyId(reviewId);
    setError("");
    try {
      await apiFetch<{ ok: true; review: ModerationReview }>("/api/reviews/moderation", {
        method: "POST",
        body: JSON.stringify({
          reviewId,
          action,
          reason: action === "reject" ? "Did not meet moderation quality threshold." : undefined,
        }),
      });
      await load();
    } catch (requestError) {
      setError((requestError as Error).message || "Failed to update review status.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="rounded-2xl border bg-card p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Reviews
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">
            Moderation Queue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Approve or reject verified-buyer reviews before they publish on the storefront.
          </p>

          {loading ? <p className="mt-6 text-sm text-muted-foreground">Loading...</p> : null}
          {error ? <p className="mt-6 text-sm text-forum-red">{error}</p> : null}

          {data ? (
            <div className="mt-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Pending
                  </div>
                  <div className="mt-1 font-heading text-2xl">{data.counts.pending}</div>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Published
                  </div>
                  <div className="mt-1 font-heading text-2xl">{data.counts.published}</div>
                </div>
                <div className="rounded-xl border bg-background/40 p-4">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Rejected
                  </div>
                  <div className="mt-1 font-heading text-2xl">{data.counts.rejected}</div>
                </div>
              </div>

              <div className="space-y-4">
                {data.pending.length ? (
                  data.pending.map((review) => (
                    <article key={review.id} className="rounded-xl border bg-background/40 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {review.productName} · {review.rating}/5 · Order {review.orderId}
                          </p>
                          <h2 className="mt-1 font-heading text-lg font-bold uppercase tracking-tight">
                            {review.title}
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                          <p className="mt-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {review.authorName} · {new Date(review.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            disabled={busyId === review.id}
                            onClick={() => moderate(review.id, "publish")}
                            className="rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:opacity-60"
                          >
                            Publish
                          </button>
                          <button
                            type="button"
                            disabled={busyId === review.id}
                            onClick={() => moderate(review.id, "reject")}
                            className="rounded-md border border-forum-red px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-forum-red transition-colors hover:bg-forum-red/10 disabled:opacity-60"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <p className="rounded-xl border bg-background/40 p-4 text-sm text-muted-foreground">
                    No pending reviews.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ReviewModeration;

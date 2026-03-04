import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  fetchReviewRequest,
  submitReview,
  type ReviewRequestItem,
  type ReviewRequestResponse,
} from "@/lib/reviews";

const tokenFromSearch = (search: string) => {
  const params = new URLSearchParams(search);
  return (params.get("token") ?? "").trim();
};

const Review = () => {
  const { search } = useLocation();
  const token = useMemo(() => tokenFromSearch(search), [search]);

  const [requestData, setRequestData] = useState<ReviewRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [selectedProductId, setSelectedProductId] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing review token.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchReviewRequest(token);
        if (cancelled) return;
        setRequestData(data);
        const firstPending = data.items.find((item) => !item.alreadyReviewed)?.productId;
        setSelectedProductId(firstPending ?? data.items[0]?.productId ?? "");
      } catch (requestError) {
        if (cancelled) return;
        setError((requestError as Error).message || "Unable to load review request.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const selectedItem: ReviewRequestItem | undefined = useMemo(
    () => requestData?.items.find((item) => item.productId === selectedProductId),
    [requestData?.items, selectedProductId]
  );

  const remainingCount = useMemo(
    () => requestData?.items.filter((item) => !item.alreadyReviewed).length ?? 0,
    [requestData?.items]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !selectedProductId) return;

    setSubmitting(true);
    setError("");
    setSuccessMessage("");
    try {
      await submitReview({
        token,
        productId: selectedProductId,
        rating,
        title: title.trim(),
        body: body.trim(),
        authorName: authorName.trim() || undefined,
      });
      setSuccessMessage("Review submitted. It is now in moderation.");
      setBody("");
      setTitle("");
      setRating(5);
      setRequestData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.productId === selectedProductId ? { ...item, alreadyReviewed: true } : item
          ),
        };
      });
    } catch (requestError) {
      setError((requestError as Error).message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 md:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
            Verified Buyer Review
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-tight">
            Share Your Feedback
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Reviews are moderated before publishing.
          </p>

          {loading ? (
            <div className="mt-6 text-sm text-muted-foreground">Loading review request...</div>
          ) : error ? (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-forum-red">{error}</p>
              <Link
                to="/contact"
                className="inline-flex rounded-md border border-foreground bg-foreground px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground"
              >
                Contact Support
              </Link>
            </div>
          ) : requestData ? (
            <div className="mt-6 space-y-6">
              <div className="rounded-xl border bg-background/40 p-4 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Order {requestData.orderId} · {requestData.email} · {remainingCount} pending
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Product
                </label>
                <select
                  value={selectedProductId}
                  onChange={(event) => setSelectedProductId(event.target.value)}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground focus:border-foreground/60 focus:outline-none"
                >
                  {requestData.items.map((item) => (
                    <option key={item.productId} value={item.productId} disabled={item.alreadyReviewed}>
                      {item.name}
                      {item.alreadyReviewed ? " (already submitted)" : ""}
                    </option>
                  ))}
                </select>

                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Rating
                </label>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className={`rounded-full border px-4 py-2 text-[11px] font-mono uppercase tracking-widest ${
                        rating === value
                          ? "border-foreground bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {value} star{value > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Headline
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder={selectedItem ? `${selectedItem.name} fit / quality` : "Short headline"}
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none"
                />

                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Review
                </label>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  placeholder="Talk about fit, fabric, print quality, and shipping experience."
                  rows={5}
                  required
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none"
                />

                <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Display Name (optional)
                </label>
                <input
                  value={authorName}
                  onChange={(event) => setAuthorName(event.target.value)}
                  placeholder="Defaults to Verified Buyer"
                  className="w-full rounded-lg border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground/60 focus:outline-none"
                />

                {successMessage ? <p className="text-sm text-forum-green">{successMessage}</p> : null}
                {error ? <p className="text-sm text-forum-red">{error}</p> : null}

                <button
                  type="submit"
                  disabled={submitting || !selectedProductId || selectedItem?.alreadyReviewed}
                  className="rounded-lg border border-foreground bg-foreground px-5 py-3 text-xs font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          ) : null}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Review;

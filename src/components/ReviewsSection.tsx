import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReviewCard from "@/components/ReviewCard";
import { fetchPublicReviews, type PublicReview } from "@/lib/reviews";

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await fetchPublicReviews(6);
        if (cancelled) return;
        setReviews(data.reviews ?? []);
        setTotal(data.total ?? 0);
        setAverageRating(data.averageRating ?? 0);
      } catch (requestError) {
        if (cancelled) return;
        setError((requestError as Error).message || "Unable to load reviews.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-center gap-4">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
            COMMUNITY REVIEWS
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground">
            {total} VERIFIED POSTS
          </span>
          {averageRating > 0 ? (
            <span className="font-mono text-xs text-muted-foreground">
              {averageRating.toFixed(1)} / 5
            </span>
          ) : null}
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b bg-secondary px-6 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              PINNED — Verified Buyer Thread
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">MODERATED</span>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading reviews...</div>
          ) : reviews.length ? (
            reviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <div className="space-y-4 p-6 text-sm text-muted-foreground">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground">
                No verified reviews yet
              </p>
              <p>
                Reviews publish after completed orders and moderation approval. This section stays
                empty until real buyer feedback is available.
              </p>
              {error ? <p className="text-forum-red">Review API: {error}</p> : null}
              <Link
                to="/shop/new"
                className="inline-flex rounded-md border border-foreground bg-foreground px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-transparent hover:text-foreground"
              >
                Explore New Releases
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

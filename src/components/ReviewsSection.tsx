import { reviews } from "@/data/reviews";
import ReviewCard from "./ReviewCard";

const ReviewsSection = () => {
  return (
    <section className="border-b py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-center gap-4">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
            VERIFIED USER POSTS
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground">
            {reviews.length} REPLIES
          </span>
        </div>
        <div className="border bg-card">
          {/* Thread header */}
          <div className="flex items-center justify-between border-b bg-secondary px-6 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              📌 PINNED — Customer Reviews Thread
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              LOCKED BY ADMIN
            </span>
          </div>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;

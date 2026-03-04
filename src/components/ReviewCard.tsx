import type { PublicReview } from "@/lib/reviews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, User } from "lucide-react";

interface ReviewCardProps {
  review: PublicReview;
}

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const ReviewCard = ({ review }: ReviewCardProps) => {
  const rounded = Math.max(1, Math.min(5, Math.round(review.rating)));
  return (
    <div className="border-b border-border p-6 last:border-b-0">
      <div className="flex gap-4">
        <Avatar className="h-10 w-10 border border-border bg-muted">
          <AvatarFallback className="bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <span className="font-heading text-sm font-bold uppercase tracking-[0.08em] text-foreground">
              {review.authorName}
            </span>
            {review.verified ? (
              <span className="border border-border bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Verified Buyer
              </span>
            ) : null}
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Re: {review.productName}
            </span>
          </div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, idx) => (
                <Star
                  key={`${review.id}-star-${idx}`}
                  className={`h-3.5 w-3.5 ${
                    idx < rounded
                      ? "fill-foreground text-foreground"
                      : "fill-transparent text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              {rounded}/5
            </span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.04em] leading-relaxed text-foreground/95">{review.title}</p>
          <p className="mb-2 text-sm leading-relaxed text-foreground/80">{review.body}</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Posted {formatDate(review.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;

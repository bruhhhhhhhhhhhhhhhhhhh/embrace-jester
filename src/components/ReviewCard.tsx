import type { Review } from "@/data/reviews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "lucide-react";

interface ReviewCardProps {
  review: Review;
}

const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="border-b p-6 last:border-b-0">
      <div className="flex gap-4">
        {/* Avatar */}
        <Avatar className="h-10 w-10 rounded-none border bg-muted">
          <AvatarFallback className="rounded-none bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-3">
            <span className="font-heading text-sm font-bold text-forum-green">
              {review.username}
            </span>
            <span className="border bg-card px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              Reputation: {review.reputation}+
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              Re: {review.product}
            </span>
          </div>
          <p className="mb-2 text-sm leading-relaxed text-foreground/80">
            {review.text}
          </p>
          <span className="font-mono text-[10px] text-muted-foreground">
            Posted {review.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;

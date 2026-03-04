export interface Review {
  id: string;
  username: string;
  reputation: number;
  text: string;
  timestamp: string;
  product: string;
}

// Intentionally empty until real post-purchase reviews are available.
export const reviews: Review[] = [];

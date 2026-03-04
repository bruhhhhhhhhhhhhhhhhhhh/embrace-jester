import { apiFetch } from "@/lib/api";

export type PublicReview = {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  verified: boolean;
};

export type PublicReviewsResponse = {
  total: number;
  averageRating: number;
  reviews: PublicReview[];
};

export type ReviewRequestItem = {
  productId: string;
  name: string;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
  alreadyReviewed: boolean;
};

export type ReviewRequestResponse = {
  orderId: string;
  email: string;
  expiresAt: string;
  createdAt: string;
  items: ReviewRequestItem[];
};

export const fetchPublicReviews = async (limit = 6, productId?: string) => {
  const params = new URLSearchParams();
  params.set("limit", String(limit));
  if (productId) params.set("productId", productId);
  return apiFetch<PublicReviewsResponse>(`/api/reviews/public?${params.toString()}`);
};

export const fetchReviewRequest = async (token: string) =>
  apiFetch<ReviewRequestResponse>(`/api/reviews/request?token=${encodeURIComponent(token)}`);

export const submitReview = async (payload: {
  token: string;
  productId: string;
  rating: number;
  title: string;
  body: string;
  authorName?: string;
}) =>
  apiFetch<{ ok: true; review: { id: string; status: string; productId: string } }>(
    "/api/reviews/submit",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );

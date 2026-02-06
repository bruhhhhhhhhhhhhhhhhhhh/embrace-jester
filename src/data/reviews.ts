export interface Review {
  id: string;
  username: string;
  reputation: number;
  text: string;
  timestamp: string;
  product: string;
}

export const reviews: Review[] = [
  {
    id: "1",
    username: "Verified Purchaser",
    reputation: 127,
    text: "Copped the Stat-Check Hoodie. The heavyweight cotton is no joke — this thing is built like armor. Fit is slightly oversized which is exactly what you want for the silhouette. Instant wardrobe staple.",
    timestamp: "2 hours ago",
    product: "STAT-CHECK HOODIE",
  },
  {
    id: "2",
    username: "Verified Purchaser",
    reputation: 99,
    text: "Mogger Cargos are unreal. The pocket placement is actually functional unlike most streetwear brands. Wore them to the gym and got three compliments. Width is perfect for bigger builds.",
    timestamp: "5 hours ago",
    product: "MOGGER CARGO PANTS",
  },
  {
    id: "3",
    username: "Verified Purchaser",
    reputation: 214,
    text: "Second order from this store. PSL Theory Tee quality is leagues above anything at this price point. The print hasn't cracked after 10+ washes. If you know, you know.",
    timestamp: "1 day ago",
    product: "PSL THEORY TEE",
  },
  {
    id: "4",
    username: "Verified Purchaser",
    reputation: 156,
    text: "Frame Maxx Jacket arrived today. The construction quality is insane for the price — reinforced stitching, heavy zippers, lined interior. This is a genuine investment piece. Already eyeing the cargos.",
    timestamp: "3 days ago",
    product: "FRAME MAXX JACKET",
  },
];

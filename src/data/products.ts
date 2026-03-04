export type ProductColor = {
  name: string;
  hex: string;
};

export type SizeGuide = {
  columns: { key: string; label: string }[];
  rows: Array<Record<string, string>>;
  note?: string;
};

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  viewers: number;
  category?: string;
  gallery?: string[];
  colorImageMap?: Record<string, string[]>;
  views?: {
    front?: string;
    back?: string;
  };
  printify?: {
    blueprintId?: number;
    printProviderId?: number;
    variants?: Array<{
      id: number;
      price?: number;
      isEnabled?: boolean;
      color?: string;
      size?: string;
    }>;
  };
  sizes?: string[];
  colors?: ProductColor[];
  description?: string;
  details?: string[];
  drop?: string;
  fitNotes?: string[];
  sizeGuide?: SizeGuide;
  source?: "printify" | "static";
  status?: "draft" | "live";
  createdAt?: string;
  aliases?: string[];
}

export const products: Product[] = [
  {
    id: "1",
    name: "STAT-CHECK HOODIE — ONYX",
    price: 89,
    image: "/mockups/product-fallback.svg",
    stock: 3,
    viewers: 47,
    category: "hoodies",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Onyx", hex: "#0c0c0f" },
      { name: "Ash", hex: "#6f737b" },
      { name: "Bone", hex: "#e6e1d8" },
    ],
    description:
      "Heavyweight fleece built for clean lines and a dominant silhouette. Brushed interior keeps heat locked without the bulk.",
    details: [
      "480gsm cotton fleece",
      "Double-layer hood with concealed drawcord",
      "Oversized shoulders with cropped hem",
      "Pre-shrunk, garment washed",
    ],
    drop: "Drop 001",
    fitNotes: [
      "Oversized through the shoulder with a cropped hem.",
      "Heavyweight fleece sits structured without cling.",
      "Stick to true size for a boxy fit. Size up for extra drape.",
    ],
    sizeGuide: {
      columns: [
        { key: "size", label: "Size" },
        { key: "chest", label: "Chest" },
        { key: "length", label: "Length" },
      ],
      rows: [
        { size: "XS", chest: "See chart", length: "See chart" },
        { size: "S", chest: "See chart", length: "See chart" },
        { size: "M", chest: "See chart", length: "See chart" },
        { size: "L", chest: "See chart", length: "See chart" },
        { size: "XL", chest: "See chart", length: "See chart" },
        { size: "XXL", chest: "See chart", length: "See chart" },
      ],
      note: "Use the size chart image on the product page for exact measurements.",
    },
  },
  {
    id: "2",
    name: "MOGGER CARGO PANTS",
    price: 120,
    image: "/mockups/product-fallback.svg",
    stock: 12,
    viewers: 31,
    category: "bottoms",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["28", "30", "32", "34", "36"],
    colors: [
      { name: "Onyx", hex: "#141414" },
      { name: "Slate", hex: "#3f4a52" },
      { name: "Sand", hex: "#b4aa95" },
    ],
    description:
      "Structured cargo silhouette with tactical pocketing and a clean taper. Built to stack or cuff with boots.",
    details: [
      "Mid-weight ripstop twill",
      "Articulated knees",
      "6-pocket loadout",
      "Adjustable hem cinch",
    ],
    drop: "Restock",
    fitNotes: [
      "Mid-rise waist with a relaxed thigh and tapered leg.",
      "Designed to stack on sneakers or cuff clean.",
      "If between sizes, size up for more room in the seat.",
    ],
    sizeGuide: {
      columns: [
        { key: "size", label: "Size" },
        { key: "waist", label: "Waist" },
        { key: "inseam", label: "Inseam" },
      ],
      rows: [
        { size: "28", waist: "See chart", inseam: "See chart" },
        { size: "30", waist: "See chart", inseam: "See chart" },
        { size: "32", waist: "See chart", inseam: "See chart" },
        { size: "34", waist: "See chart", inseam: "See chart" },
        { size: "36", waist: "See chart", inseam: "See chart" },
      ],
      note: "Use the size chart image on the product page for exact measurements.",
    },
  },
  {
    id: "3",
    name: "PSL THEORY TEE — WHITE",
    price: 55,
    image: "/mockups/product-fallback.svg",
    stock: 2,
    viewers: 89,
    category: "tees",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#f5f5f5" },
      { name: "Black", hex: "#101010" },
    ],
    description:
      "Soft handfeel with a structured collar so it holds its shape. Built for layered fits or solo wear.",
    details: [
      "240gsm ring-spun cotton",
      "Boxy cut with dropped shoulder",
      "Reinforced neck rib",
      "Minimal front branding",
    ],
    drop: "Core",
    fitNotes: [
      "Boxy body with dropped shoulder.",
      "Length hits just below the waist for clean layering.",
      "Stick to true size for standard boxy fit.",
    ],
  },
  {
    id: "4",
    name: "HUNTER EYES CAP",
    price: 45,
    image: "/mockups/product-fallback.svg",
    stock: 8,
    viewers: 23,
    category: "accessories",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["OS"],
    colors: [
      { name: "Onyx", hex: "#141414" },
      { name: "Forest", hex: "#2b3c2f" },
    ],
    description:
      "Low-profile cap with a tight stitch and clean visor. Subtle enough for daily wear, sharp enough for the fit.",
    details: [
      "Structured 6-panel build",
      "Adjustable strapback",
      "Embroidered front mark",
      "Moisture-wick sweatband",
    ],
    drop: "Core",
  },
  {
    id: "5",
    name: "FRAME MAXX JACKET",
    price: 195,
    image: "/mockups/product-fallback.svg",
    stock: 4,
    viewers: 62,
    category: "outerwear",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Onyx", hex: "#0f1014" },
      { name: "Steel", hex: "#6b737f" },
    ],
    description:
      "Cropped outerwear engineered for a wider shoulder line and a clean drape. Layer-ready and built to last.",
    details: [
      "Shell: poly-cotton blend",
      "Quilted interior lining",
      "Hidden utility pocket",
      "Matte black hardware",
    ],
    drop: "Drop 002",
  },
  {
    id: "6",
    name: "ASCEND TRACK SHORTS",
    price: 65,
    image: "/mockups/product-fallback.svg",
    stock: 15,
    viewers: 18,
    category: "bottoms",
    gallery: ["/mockups/product-fallback.svg", "/mockups/product-fallback.svg", "/mockups/product-fallback.svg"],
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Onyx", hex: "#111111" },
      { name: "Volt", hex: "#c7f000" },
    ],
    description:
      "Lightweight track short with an athletic cut. Made for hot days, gym runs, or clean streetwear fits.",
    details: [
      "Breathable mesh liner",
      "Zippered side pockets",
      "Reflective logo hit",
      "Stretch waistband",
    ],
    drop: "Core",
  },
];

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  viewers: number;
}

export const products: Product[] = [
  {
    id: "1",
    name: "STAT-CHECK HOODIE — ONYX",
    price: 89,
    image: "/placeholder.svg",
    stock: 3,
    viewers: 47,
  },
  {
    id: "2",
    name: "MOGGER CARGO PANTS",
    price: 120,
    image: "/placeholder.svg",
    stock: 12,
    viewers: 31,
  },
  {
    id: "3",
    name: "PSL THEORY TEE — WHITE",
    price: 55,
    image: "/placeholder.svg",
    stock: 2,
    viewers: 89,
  },
  {
    id: "4",
    name: "HUNTER EYES CAP",
    price: 45,
    image: "/placeholder.svg",
    stock: 8,
    viewers: 23,
  },
  {
    id: "5",
    name: "FRAME MAXX JACKET",
    price: 195,
    image: "/placeholder.svg",
    stock: 4,
    viewers: 62,
  },
  {
    id: "6",
    name: "ASCEND TRACK SHORTS",
    price: 65,
    image: "/placeholder.svg",
    stock: 15,
    viewers: 18,
  },
];

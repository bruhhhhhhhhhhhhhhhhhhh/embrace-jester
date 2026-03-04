export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
}

export const heroSlides: HeroSlide[] = [
  {
    id: "1",
    title: "EMBRACE THE MASK",
    subtitle: "Monochrome essentials for men building presence in silence.",
    cta: "VIEW THE DROP",
    ctaLink: "/product/69881e327d7ff99e6b03d225",
  },
  {
    id: "2",
    title: "JESTER CARGO RESTOCK",
    subtitle: "Sharp utility lines cut for movement, structure, and contrast.",
    cta: "SHOP BOTTOMS",
    ctaLink: "/shop/bottoms",
  },
  {
    id: "3",
    title: "DARK COURT OUTERWEAR",
    subtitle: "Hard silhouettes with stark detailing for the night rotation.",
    cta: "EXPLORE OUTERWEAR",
    ctaLink: "/shop/outerwear",
  },
];

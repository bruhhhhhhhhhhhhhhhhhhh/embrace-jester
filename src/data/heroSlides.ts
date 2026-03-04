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
    title: "I PAUSED MY .ORG TO BE HERE",
    subtitle: "Limited-run tee for builders who show up IRL.",
    cta: "VIEW THE TEE",
    ctaLink: "/product/69881e327d7ff99e6b03d225",
  },
  {
    id: "2",
    title: "MOGGER CARGO — NOW RESTOCKED",
    subtitle: "Tactical utility meets raw aesthetic. Limited run.",
    cta: "VIEW CARGOS",
    ctaLink: "/shop/bottoms",
  },
  {
    id: "3",
    title: "FRAME MAXX OUTERWEAR",
    subtitle: "Engineered silhouettes. Built for visual dominance.",
    cta: "EXPLORE JACKETS",
    ctaLink: "/shop/outerwear",
  },
];

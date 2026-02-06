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
    title: "DROP 001: STAT-CHECK COLLECTION",
    subtitle: "Heavyweight cotton. Optimized fit. Mog or be mogged.",
    cta: "SHOP THE DROP",
    ctaLink: "#",
  },
  {
    id: "2",
    title: "MOGGER CARGO — NOW RESTOCKED",
    subtitle: "Tactical utility meets raw aesthetic. Limited run.",
    cta: "VIEW CARGOS",
    ctaLink: "#",
  },
  {
    id: "3",
    title: "FRAME MAXX OUTERWEAR",
    subtitle: "Engineered silhouettes. Built for visual dominance.",
    cta: "EXPLORE JACKETS",
    ctaLink: "#",
  },
];

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
    title: "UNIFORMS FOR CONTROLLED PRESENCE",
    subtitle: "Built in black. Quiet, rigid, deliberate.",
    cta: "SHOP THE DROP",
    ctaLink: "/product/69881e327d7ff99e6b03d225",
  },
  {
    id: "2",
    title: "SEVERE ESSENTIALS",
    subtitle: "Structured utility with clean proportion.",
    cta: "VIEW COLLECTION",
    ctaLink: "/shop/bottoms",
  },
  {
    id: "3",
    title: "OUTER LAYERS, REDUCED",
    subtitle: "Cold structure. Hard finish. No excess.",
    cta: "VIEW COLLECTION",
    ctaLink: "/shop/outerwear",
  },
];

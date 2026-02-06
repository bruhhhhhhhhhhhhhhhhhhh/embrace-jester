import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { heroSlides } from "@/data/heroSlides";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

const slideImages = [heroSlide1, heroSlide2, heroSlide3];

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const total = heroSlides.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-advance every 5s
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = heroSlides[current];

  return (
    <section className="relative w-full overflow-hidden">
      {/* Slides */}
      <div className="relative h-[60vh] w-full md:h-[75vh]">
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <img
              src={slideImages[i]}
              alt={s.title}
              className="h-full w-full object-cover"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ))}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="mb-3 font-mono text-xs tracking-[0.3em] text-muted-foreground md:text-sm">
            AVAILABLE NOW
          </p>
          <h1 className="mb-4 max-w-3xl font-heading text-3xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {slide.title}
          </h1>
          <p className="mb-8 max-w-md text-base text-foreground/70 md:text-lg">
            {slide.subtitle}
          </p>
          <a
            href={slide.ctaLink}
            className="rounded-lg bg-primary px-8 py-4 font-heading text-sm font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/80"
          >
            {slide.cta}
          </a>
        </div>

        {/* Arrows */}
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/40 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background/70 md:left-8 md:p-3"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/40 p-2 text-foreground backdrop-blur-sm transition-colors hover:bg-background/70 md:right-8 md:p-3"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2.5 w-2.5 rounded-full border border-foreground/30 transition-all ${
              i === current
                ? "bg-foreground w-6"
                : "bg-foreground/30 hover:bg-foreground/50"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;

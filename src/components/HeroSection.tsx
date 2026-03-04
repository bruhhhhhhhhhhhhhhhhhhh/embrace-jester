import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { heroSlides } from "@/data/heroSlides";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";
import { trackConversionEvent, trackConversionEventOnce } from "@/lib/conversion";

const slideImages = [heroSlide1, heroSlide2, heroSlide3];
const slideVideos: Record<number, string> = {
  0: "/hero/hero-loop-01.mp4",
};
const DEFAULT_IMAGE_DURATION_MS = 7000;
const DEFAULT_VIDEO_DURATION_MS = 12000;
const productIdFromCta = (href: string) => {
  const match = href.match(/^\/product\/([^/?#]+)/);
  return match?.[1];
};

const HeroSection = () => {
  const [current, setCurrent] = useState(0);
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({});
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});
  const total = heroSlides.length;

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + total) % total);
  }, [total]);

  const currentDurationMs = useMemo(() => {
    if (!slideVideos[current]) return DEFAULT_IMAGE_DURATION_MS;
    const seconds = videoDurations[current];
    if (!seconds || !Number.isFinite(seconds) || seconds <= 0) {
      return DEFAULT_VIDEO_DURATION_MS;
    }
    return Math.max(1000, Math.round(seconds * 1000));
  }, [current, videoDurations]);

  // Auto-advance using slide-aware duration (video length for video slides).
  useEffect(() => {
    const timer = window.setTimeout(next, currentDurationMs);
    return () => window.clearTimeout(timer);
  }, [next, currentDurationMs]);

  useEffect(() => {
    const activeSlide = heroSlides[current];
    trackConversionEventOnce(
      `hero_impression:${activeSlide.id}`,
      "hero_impression",
      { productId: productIdFromCta(activeSlide.ctaLink) }
    );
  }, [current]);

  const nextIndex = (current + 1) % total;

  useEffect(() => {
    if (slideVideos[nextIndex]) {
      const preloadVideo = document.createElement("video");
      preloadVideo.src = slideVideos[nextIndex];
      preloadVideo.preload = "metadata";
      return;
    }
    const img = new Image();
    img.src = slideImages[nextIndex];
  }, [nextIndex]);

  useEffect(() => {
    const resumeAllVideos = () => {
      Object.values(videoRefs.current).forEach((video) => {
        if (!video) return;
        if (video.paused) {
          video.play().catch(() => undefined);
        }
      });
    };

    const handleVisibility = () => {
      if (!document.hidden) resumeAllVideos();
    };

    window.addEventListener("focus", resumeAllVideos);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", resumeAllVideos);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const slide = heroSlides[current];
  const isInternalLink = slide.ctaLink.startsWith("/");

  return (
    <section className="relative w-full overflow-hidden">
      {/* Slides */}
      <div className="relative h-[60vh] w-full md:h-[75vh]">
        {heroSlides.map((s, i) => {
          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                i === current ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {slideVideos[i] ? (
                <video
                  src={slideVideos[i]}
                  className="h-full w-full object-cover"
                  style={{
                    transform: "scale(1.08) translate(-2.5%, -2.5%)",
                    transformOrigin: "top left",
                  }}
                  ref={(node) => {
                    videoRefs.current[i] = node;
                  }}
                  onLoadedMetadata={(event) => {
                    const seconds = event.currentTarget.duration;
                    if (!Number.isFinite(seconds) || seconds <= 0) return;
                    setVideoDurations((prev) =>
                      prev[i] === seconds ? prev : { ...prev, [i]: seconds }
                    );
                  }}
                  onCanPlay={(event) => {
                    if (event.currentTarget.paused) {
                      event.currentTarget.play().catch(() => undefined);
                    }
                  }}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload={i === current ? "auto" : "metadata"}
                />
              ) : (
                <img
                  src={slideImages[i]}
                  alt={s.title}
                  className="h-full w-full object-cover"
                  loading={i === current ? "eager" : "lazy"}
                  decoding="async"
                  fetchPriority={i === current ? "high" : "auto"}
                />
              )}
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            </div>
          );
        })}

        {/* Content overlay */}
        <div className="pointer-events-none absolute inset-0">
          <div className="container mx-auto flex h-full items-end px-6 pb-10 md:pb-16">
            <div className="pointer-events-auto max-w-xl rounded-xl border border-border/60 bg-background/50 p-5 text-left backdrop-blur-sm md:p-6">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground md:text-xs">
                AVAILABLE NOW
              </p>
              <h1 className="mb-3 font-heading text-2xl font-bold uppercase leading-tight tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {slide.title}
              </h1>
              <p className="mb-5 max-w-lg text-sm text-foreground/75 md:text-base">
                {slide.subtitle}
              </p>
              {isInternalLink ? (
                <Link
                  to={slide.ctaLink}
                  onClick={() =>
                    trackConversionEvent("hero_cta_click", {
                      productId: productIdFromCta(slide.ctaLink),
                    })
                  }
                  className="inline-flex rounded-lg bg-primary px-6 py-3 font-heading text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/80 md:px-8 md:py-4 md:text-sm"
                >
                  {slide.cta}
                </Link>
              ) : (
                <a
                  href={slide.ctaLink}
                  onClick={() => trackConversionEvent("hero_cta_click")}
                  className="inline-flex rounded-lg bg-primary px-6 py-3 font-heading text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary/80 md:px-8 md:py-4 md:text-sm"
                >
                  {slide.cta}
                </a>
              )}
            </div>
          </div>
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

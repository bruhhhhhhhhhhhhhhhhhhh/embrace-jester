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
    <section className="relative w-full overflow-hidden border-b border-border bg-background">
      <div className="relative h-[68vh] min-h-[560px] w-full border-b border-border md:h-[82vh]">
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
              <div className="absolute inset-0 bg-black/68" />
            </div>
          );
        })}

        <div className="pointer-events-none absolute inset-0">
          <div className="container mx-auto flex h-full items-end px-6 pb-20 md:pb-24">
            <div className="pointer-events-auto max-w-xl text-left">
              <div className="mb-5 flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
                <span>Embrace Jester / Editorial Uniforms</span>
                <span className="h-px w-12 bg-border" />
              </div>
              <h1 className="max-w-[12ch] font-heading text-4xl font-bold uppercase leading-[0.88] tracking-[0.08em] text-foreground md:text-6xl lg:text-7xl">
                {slide.title}
              </h1>
              <p className="mt-4 max-w-md font-body text-sm text-foreground/80 md:text-base">
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
                  className="mt-7 inline-flex rounded-none border border-foreground bg-foreground px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0 md:px-8 md:py-4"
                >
                  {slide.cta}
                </Link>
              ) : (
                <a
                  href={slide.ctaLink}
                  onClick={() => trackConversionEvent("hero_cta_click")}
                  className="mt-7 inline-flex rounded-none border border-foreground bg-foreground px-6 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-background transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0 md:px-8 md:py-4"
                >
                  {slide.cta}
                </a>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 border border-border bg-background/90 px-2 py-2 text-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background md:left-8 md:px-3 md:py-3"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 border border-border bg-background/90 px-2 py-2 text-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background md:right-8 md:px-3 md:py-3"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 w-10 border border-border transition-colors duration-150 focus-visible:border-foreground ${
              i === current
                ? "bg-foreground"
                : "bg-background hover:border-foreground"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSection;

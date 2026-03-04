import { Lock } from "lucide-react";
import type { Product } from "@/data/products";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { isNewProduct } from "@/lib/productFreshness";

interface ProductCardProps {
  product: Product;
}

const pickFrontImage = (images?: string[]) => {
  if (!images?.length) return undefined;
  return (
    images.find((src) => src.includes("camera_label=front")) ??
    images.find((src) => src.includes("front")) ??
    images[0]
  );
};

const toTransparentMockup = (url: string) =>
  url.replace(/\.(jpe?g|webp)(\?.*)?$/i, (_, __, query = "") => `.png${query}`);

const toOpaqueMockup = (url: string) => url.replace(/\.png(\?.*)?$/i, ".jpg$1");
const PRODUCT_FALLBACK_IMAGE = "/mockups/product-fallback.svg";
const mockupSourceCache = new Map<string, string>();

const preloadImage = (src: string) =>
  new Promise<boolean>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(true);
    image.onerror = () => resolve(false);
    image.src = src;
  });

const resolveMockupSource = async (baseSrc: string) => {
  const cached = mockupSourceCache.get(baseSrc);
  if (cached) return cached;

  const transparentSrc = toTransparentMockup(baseSrc);
  const hasTransparent = await preloadImage(transparentSrc);
  const resolved = hasTransparent ? transparentSrc : toOpaqueMockup(baseSrc);
  mockupSourceCache.set(baseSrc, resolved);
  return resolved;
};

const withImageFallback = (image: HTMLImageElement, preferredFallback: string) => {
  const step = Number(image.dataset.fallbackStep ?? "0");
  if (step === 0) {
    image.dataset.fallbackStep = "1";
    if (preferredFallback && !image.currentSrc.endsWith(preferredFallback)) {
      image.src = preferredFallback;
      return;
    }
  }

  if (step <= 1) {
    image.dataset.fallbackStep = "2";
    image.src = PRODUCT_FALLBACK_IMAGE;
  }
};

const ProductCard = ({ product }: ProductCardProps) => {
  const isLowStock = product.stock > 0 && product.stock < 5;
  const isSoldOut = product.stock <= 0;
  const isNew = isNewProduct(product.createdAt);
  const previewImage = useMemo(() => product.gallery?.[0] ?? product.image, [product.gallery, product.image]);
  const previewImageTransparent = useMemo(() => toTransparentMockup(previewImage), [previewImage]);
  const [isHovered, setIsHovered] = useState(false);
  const [hoverColorIndex, setHoverColorIndex] = useState(0);
  const hoverDirectionRef = useRef<1 | -1>(1);
  const hoverTransitionTimerRef = useRef<number | null>(null);
  const hoverTransitionFrameRef = useRef<number | null>(null);
  const [displayedHoverImage, setDisplayedHoverImage] = useState("");
  const [incomingHoverImage, setIncomingHoverImage] = useState("");
  const [resolvedHoverImage, setResolvedHoverImage] = useState("");
  const [isIncomingVisible, setIsIncomingVisible] = useState(false);

  const cycleColorNames = useMemo(() => {
    const map = product.colorImageMap ?? {};
    const available = Object.entries(map)
      .filter(([, images]) => Boolean(images?.length))
      .map(([color]) => color);
    if (!available.length) return [];

    const orderedFromProduct = (product.colors ?? [])
      .map((color) => color.name)
      .filter((name) => available.includes(name));
    const remainder = available.filter((name) => !orderedFromProduct.includes(name));
    return orderedFromProduct.concat(remainder);
  }, [product.colorImageMap, product.colors]);

  const hoveredColorName = isHovered ? cycleColorNames[hoverColorIndex] : undefined;
  const hoveredImage = useMemo(
    () => pickFrontImage(hoveredColorName ? product.colorImageMap?.[hoveredColorName] : undefined),
    [hoveredColorName, product.colorImageMap]
  );
  const hoverTargetImage = hoveredImage || "";

  useEffect(() => {
    if (!isHovered) {
      setHoverColorIndex(0);
      hoverDirectionRef.current = 1;
      if (hoverTransitionTimerRef.current !== null) {
        window.clearTimeout(hoverTransitionTimerRef.current);
        hoverTransitionTimerRef.current = null;
      }
      setIncomingHoverImage("");
      setDisplayedHoverImage("");
      setResolvedHoverImage("");
      setIsIncomingVisible(false);
      return;
    }

    // Warm the browser cache so swaps feel instant when cycling.
    cycleColorNames.forEach((colorName) => {
      const src = pickFrontImage(product.colorImageMap?.[colorName]);
      if (!src) return;
      void resolveMockupSource(src);
    });
  }, [cycleColorNames, isHovered, product.colorImageMap]);

  useEffect(() => {
    if (!isHovered || cycleColorNames.length <= 1) return;
    hoverDirectionRef.current = 1;
    const intervalId = window.setInterval(() => {
      setHoverColorIndex((idx) => {
        const lastIndex = cycleColorNames.length - 1;
        const nextIndex = idx + hoverDirectionRef.current;

        if (nextIndex >= lastIndex) {
          hoverDirectionRef.current = -1;
          return lastIndex;
        }
        if (nextIndex <= 0) {
          hoverDirectionRef.current = 1;
          return 0;
        }
        return nextIndex;
      });
    }, 2200);
    return () => window.clearInterval(intervalId);
  }, [cycleColorNames.length, isHovered]);

  useEffect(() => {
    if (!isHovered || !hoverTargetImage) {
      setResolvedHoverImage("");
      return;
    }
    let isCancelled = false;
    void resolveMockupSource(hoverTargetImage).then((resolvedSrc) => {
      if (isCancelled) return;
      setResolvedHoverImage(resolvedSrc);
    });
    return () => {
      isCancelled = true;
    };
  }, [hoverTargetImage, isHovered]);

  useEffect(() => {
    if (!isHovered) return;
    if (!resolvedHoverImage) {
      setIncomingHoverImage("");
      setDisplayedHoverImage("");
      setIsIncomingVisible(false);
      return;
    }
    if (!displayedHoverImage) {
      setDisplayedHoverImage(resolvedHoverImage);
      return;
    }
    if (resolvedHoverImage === displayedHoverImage || resolvedHoverImage === incomingHoverImage) return;

    if (hoverTransitionTimerRef.current !== null) {
      window.clearTimeout(hoverTransitionTimerRef.current);
    }
    if (hoverTransitionFrameRef.current !== null) {
      window.cancelAnimationFrame(hoverTransitionFrameRef.current);
    }
    setIncomingHoverImage(resolvedHoverImage);
    setIsIncomingVisible(false);
    hoverTransitionFrameRef.current = window.requestAnimationFrame(() => {
      setIsIncomingVisible(true);
      hoverTransitionFrameRef.current = null;
    });
    hoverTransitionTimerRef.current = window.setTimeout(() => {
      setDisplayedHoverImage(resolvedHoverImage);
      setIncomingHoverImage("");
      setIsIncomingVisible(false);
      hoverTransitionTimerRef.current = null;
    }, 700);
  }, [displayedHoverImage, incomingHoverImage, isHovered, resolvedHoverImage]);

  useEffect(
    () => () => {
      if (hoverTransitionTimerRef.current !== null) {
        window.clearTimeout(hoverTransitionTimerRef.current);
      }
      if (hoverTransitionFrameRef.current !== null) {
        window.cancelAnimationFrame(hoverTransitionFrameRef.current);
      }
    },
    []
  );

  return (
    <article
      className="group overflow-hidden rounded-ui-md border border-border/70 bg-card shadow-elev-1 transition-colors hover:border-foreground/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`} className="block">
          <AspectRatio ratio={1}>
            <div
              className="relative h-full w-full"
              style={{
                backgroundImage: "radial-gradient(circle at top, rgba(255,255,255,0.10), transparent 58%)",
              }}
            >
              <img
                src={previewImageTransparent}
                alt={product.name}
                className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 transition-opacity ${
                  isHovered && (displayedHoverImage || incomingHoverImage) ? "opacity-0" : "opacity-100"
                }`}
                loading="lazy"
                decoding="async"
                onError={(event) => {
                  withImageFallback(event.currentTarget, previewImage);
                }}
              />
              {isHovered && incomingHoverImage ? (
                <img
                  src={incomingHoverImage}
                  alt={product.name}
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 transition-opacity duration-700 ease-in-out ${
                    isIncomingVisible ? "opacity-100" : "opacity-0"
                  }`}
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    withImageFallback(event.currentTarget, toOpaqueMockup(event.currentTarget.src));
                  }}
                />
              ) : null}
              {isHovered && displayedHoverImage ? (
                <img
                  src={displayedHoverImage}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-100"
                  loading="eager"
                  decoding="async"
                  onError={(event) => {
                    withImageFallback(event.currentTarget, toOpaqueMockup(event.currentTarget.src));
                  }}
                />
              ) : null}
            </div>
          </AspectRatio>
        </Link>

        {isLowStock && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-forum-red/90 px-3 py-1">
            <Lock className="h-3 w-3 text-foreground" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              LOCKED SOON
            </span>
          </div>
        )}

        {isSoldOut ? (
          <div className="absolute left-3 top-3 rounded-md border border-forum-red/60 bg-forum-red/15 px-3 py-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-token-label text-forum-red">
              SOLD OUT
            </span>
          </div>
        ) : null}

        {isNew ? (
          <div className="absolute right-3 top-3 rounded-md border border-forum-gold/70 bg-forum-gold/20 px-2.5 py-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-token-label text-forum-gold">
              NEW
            </span>
          </div>
        ) : null}

      </div>

      <div className="p-4">
        <p className="mb-1 text-[10px] font-mono uppercase tracking-token-label text-muted-foreground">
          {product.drop ?? "Limited Release"}
        </p>
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="line-clamp-2 min-h-[3rem] font-heading text-sm font-bold uppercase tracking-tight text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <p className="font-mono text-lg font-bold text-forum-gold">${product.price}</p>
          <span className="text-[10px] font-mono uppercase tracking-token-label text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
        <Link
          to={`/product/${product.id}`}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-foreground bg-foreground px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-token-label text-background transition-colors hover:bg-transparent hover:text-foreground"
        >
          View Product
        </Link>
      </div>
    </article>
  );
};

export default memo(ProductCard);

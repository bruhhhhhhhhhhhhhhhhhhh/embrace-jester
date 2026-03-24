import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
  type MouseEvent,
  type SyntheticEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCatalog } from "@/components/catalog/catalog";
import { formatMoney } from "@/lib/money";
import { useCartActions } from "@/components/cart/cart";
import { toast } from "@/components/ui/sonner";
import ProductCard from "@/components/ProductCard";
import { legal } from "@/config/legal";
import { trackViewItem } from "@/lib/analytics";
import { isNewProduct } from "@/lib/productFreshness";
import { trackConversionEvent, trackConversionEventOnce } from "@/lib/conversion";
import { fetchPublicReviews } from "@/lib/reviews";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, RotateCcw, ShieldCheck, Truck, X } from "lucide-react";

const clampRotation = (value: number) => {
  const next = value % 360;
  return next < 0 ? next + 360 : next;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const pickByCameraLabel = (images: string[], label: string) =>
  images.find((image) => image.includes(`camera_label=${label}`));

const toTransparentMockup = (url: string) =>
  url.replace(/\.(jpe?g|webp)(\?.*)?$/i, (_, __, query = "") => `.png${query}`);
const SIZE_FALLBACK_LABEL = "See size chart";
const PRODUCT_FALLBACK_IMAGE = "/mockups/product-fallback.svg";
const PRODUCT_DESCRIPTION_OVERRIDES: Record<string, string> = {
  "698841b54c4363802b0db7e3":
    "Heavyweight garment-dyed tee with a relaxed fit, clean drape, and front graphic. Available in sizes S-4XL.",
};

const withImageFallback = (
  event: SyntheticEvent<HTMLImageElement, Event>,
  preferredFallback: string
) => {
  const image = event.currentTarget;
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

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, loading } = useCatalog();
  const product = useMemo(
    () => products.find((item) => item.id === id || item.aliases?.includes(id ?? "")),
    [id, products]
  );
  const productDescription = useMemo(() => {
    if (!product) return "Clean structure. Daily wear. No excess.";
    return PRODUCT_DESCRIPTION_OVERRIDES[product.id] ?? product.description ?? "Clean structure. Daily wear. No excess.";
  }, [product]);
  const { add } = useCartActions();

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [viewMode, setViewMode] = useState<"360" | "gallery">("360");
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startRotation: 0 });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomOrigin, setZoomOrigin] = useState("50% 50%");
  const [lensVisible, setLensVisible] = useState(false);
  const [lensPosition, setLensPosition] = useState({ x: 50, y: 50 });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [bundleSelection, setBundleSelection] = useState<Record<string, boolean>>({});
  const [reviewSummary, setReviewSummary] = useState<{
    total: number;
    averageRating: number;
    loading: boolean;
  }>({
    total: 0,
    averageRating: 0,
    loading: true,
  });
  const rotationFrameRef = useRef<number | null>(null);
  const pendingRotationRef = useRef(0);
  const trackedViewRef = useRef<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setSelectedSize(product.sizes?.[0] ?? "");
    setSelectedColor(product.colors?.[0]?.name ?? "");
    setQuantity(1);
    setRotation(0);
    setActiveImageIndex(0);
    setViewMode("360");
    setZoomOrigin("50% 50%");
    setLensVisible(false);
    setLensPosition({ x: 50, y: 50 });
    setIsGalleryOpen(false);
    trackedViewRef.current = null;
  }, [product]);

  useEffect(() => {
    pendingRotationRef.current = rotation;
  }, [rotation]);

  useEffect(
    () => () => {
      if (rotationFrameRef.current !== null) {
        window.cancelAnimationFrame(rotationFrameRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setActiveImageIndex(0);
    setDragging(false);
    pendingRotationRef.current = 0;
    if (rotationFrameRef.current !== null) {
      window.cancelAnimationFrame(rotationFrameRef.current);
      rotationFrameRef.current = null;
    }
    setRotation(0);
  }, [selectedColor, product?.id]);

  const selectedColorHex = useMemo(() => {
    if (!product?.colors?.length) return undefined;
    return product.colors.find((color) => color.name === selectedColor)?.hex ?? product.colors[0].hex;
  }, [product, selectedColor]);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const colorGallery = selectedColor ? product.colorImageMap?.[selectedColor] : undefined;
    const images = colorGallery?.length
      ? colorGallery
      : product.gallery?.length
        ? product.gallery
        : [product.image];
    return images.filter(Boolean);
  }, [product, selectedColor]);

  const activeImage = galleryImages[activeImageIndex] ?? product?.image ?? "";
  const heroImage = galleryImages[0] ?? product?.image ?? "";
  const frontMockup =
    pickByCameraLabel(galleryImages, "front") ?? heroImage;
  const backMockup =
    pickByCameraLabel(galleryImages, "back") ??
    galleryImages.find((image) => image.includes("back")) ??
    heroImage;
  const frontVisual = toTransparentMockup(frontMockup);
  const backVisual = toTransparentMockup(backMockup);
  const shouldTint = Boolean(
    selectedColorHex &&
      (!selectedColor || !product.colorImageMap?.[selectedColor])
  );

  const isBottom = product ? /pant|cargo|short|bottom/i.test(product.name) : false;
  const isCap = product ? /cap|hat/i.test(product.name) : false;
  const isNew = isNewProduct(product?.createdAt);

  const fitNotes = product?.fitNotes ?? [
    isBottom ? "Mid-rise waist with relaxed thigh taper." : "Structured through the shoulders for a sharper silhouette.",
    "Designed for layering without feeling bulky.",
    "If you are between sizes, size up for a looser drape.",
  ];

  const sizeGuide = useMemo(() => {
    if (product?.sizeGuide) return product.sizeGuide;
    const sizes = product?.sizes?.length ? product.sizes : ["OS"];
    if (isCap) {
      return {
        columns: [
          { key: "size", label: "Size" },
          { key: "circumference", label: "Circumference" },
        ],
        rows: sizes.map((size) => ({
          size,
          circumference: SIZE_FALLBACK_LABEL,
        })),
        note: "Exact measurements are available in the size chart image on this product page.",
      };
    }

    if (isBottom) {
      return {
        columns: [
          { key: "size", label: "Size" },
          { key: "waist", label: "Waist" },
          { key: "inseam", label: "Inseam" },
        ],
        rows: sizes.map((size) => ({
          size,
          waist: SIZE_FALLBACK_LABEL,
          inseam: SIZE_FALLBACK_LABEL,
        })),
        note: "Exact measurements are available in the size chart image on this product page.",
      };
    }

    return {
      columns: [
        { key: "size", label: "Size" },
        { key: "chest", label: "Chest" },
        { key: "length", label: "Length" },
      ],
      rows: sizes.map((size) => ({
        size,
        chest: SIZE_FALLBACK_LABEL,
        length: SIZE_FALLBACK_LABEL,
      })),
      note: "Exact measurements are available in the size chart image on this product page.",
    };
  }, [product, isBottom, isCap]);

  const relatedItems = useMemo(() => {
    if (!product) return [];
    const matchesCategory = product.category
      ? products.filter((item) => item.category === product.category && item.id !== product.id)
      : [];
    if (matchesCategory.length >= 3) return matchesCategory.slice(0, 3);
    const fallback = products.filter((item) => item.id !== product.id);
    const deduped = [...matchesCategory, ...fallback].filter(
      (item, index, source) => source.findIndex((candidate) => candidate.id === item.id) === index
    );
    return deduped.slice(0, 3);
  }, [product, products]);

  const bundleItems = useMemo(() => relatedItems.slice(0, 2), [relatedItems]);

  const selectedVariant = useMemo(() => {
    const variants = product?.printify?.variants;
    if (!variants?.length) return undefined;
    return (
      variants.find(
        (variant) =>
          (selectedColor ? variant.color === selectedColor : true) &&
          (selectedSize ? variant.size === selectedSize : true) &&
          (variant.isEnabled ?? true)
      ) ??
      variants.find((variant) => variant.isEnabled ?? true) ??
      variants[0]
    );
  }, [product, selectedColor, selectedSize]);

  const enabledVariants = useMemo(
    () => product?.printify?.variants?.filter((variant) => variant.isEnabled ?? true) ?? [],
    [product]
  );

  const availableColorNames = useMemo(() => {
    if (!product?.colors?.length) return new Set<string>();
    if (!enabledVariants.length) {
      return new Set(product.colors.map((color) => color.name));
    }
    return new Set(
      enabledVariants
        .filter((variant) => !selectedSize || variant.size === selectedSize)
        .map((variant) => variant.color)
        .filter((value): value is string => Boolean(value))
    );
  }, [enabledVariants, product, selectedSize]);

  const availableSizes = useMemo(() => {
    if (!product?.sizes?.length) return new Set<string>();
    if (!enabledVariants.length) {
      return new Set(product.sizes);
    }
    return new Set(
      enabledVariants
        .filter((variant) => !selectedColor || variant.color === selectedColor)
        .map((variant) => variant.size)
        .filter((value): value is string => Boolean(value))
    );
  }, [enabledVariants, product, selectedColor]);

  useEffect(() => {
    if (!product?.colors?.length || !selectedColor) return;
    if (availableColorNames.has(selectedColor)) return;
    const nextColor = product.colors.find((color) => availableColorNames.has(color.name));
    if (nextColor) {
      setSelectedColor(nextColor.name);
    }
  }, [availableColorNames, product, selectedColor]);

  useEffect(() => {
    if (!product?.sizes?.length || !selectedSize) return;
    if (availableSizes.has(selectedSize)) return;
    const nextSize = product.sizes.find((size) => availableSizes.has(size));
    if (nextSize) {
      setSelectedSize(nextSize);
    }
  }, [availableSizes, product, selectedSize]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setReviewSummary({ total: 0, averageRating: 0, loading: true });
    const loadReviewSummary = async () => {
      try {
        const data = await fetchPublicReviews(5, product.id);
        if (cancelled) return;
        setReviewSummary({
          total: data.total ?? 0,
          averageRating: data.averageRating ?? 0,
          loading: false,
        });
      } catch {
        if (cancelled) return;
        setReviewSummary({ total: 0, averageRating: 0, loading: false });
      }
    };
    void loadReviewSummary();
    return () => {
      cancelled = true;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (trackedViewRef.current === product.id) return;
    trackViewItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
      color: selectedColor || undefined,
      size: selectedSize || undefined,
    });
    trackConversionEventOnce(`pdp_view:${product.id}`, "pdp_view", {
      productId: product.id,
    });
    trackedViewRef.current = product.id;
  }, [product, selectedColor, selectedSize]);

  useEffect(() => {
    const next: Record<string, boolean> = {};
    bundleItems.forEach((item) => {
      next[item.id] = true;
    });
    setBundleSelection(next);
  }, [bundleItems]);

  const bundleTotal = useMemo(() => {
    if (!product) return 0;
    let total = product.price;
    bundleItems.forEach((item) => {
      if (bundleSelection[item.id]) {
        total += item.price;
      }
    });
    return total;
  }, [bundleItems, bundleSelection, product]);

  const bundleCount = useMemo(
    () => bundleItems.filter((item) => bundleSelection[item.id]).length,
    [bundleItems, bundleSelection]
  );

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <NotificationBar />
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="rounded-none border border-border bg-card p-10 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {loading ? "Loading Item" : "Item Missing"}
            </p>
            <h1 className="mt-3 font-heading text-3xl font-bold uppercase">
              {loading ? "Loading" : "Item Not Found"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {loading
                ? "Syncing the latest inventory."
                : "This item is no longer available. Return to the shop to continue browsing."}
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex items-center justify-center border border-primary bg-primary px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-colors duration-150 hover:bg-background hover:text-primary hover:border-primary"
            >
              View Collection
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const stockLabel =
    product.stock <= 0 ? "Sold out" : product.stock < 5 ? "Low stock" : "Available";
  const stockTone =
    product.stock <= 0
      ? "border-foreground bg-foreground text-background"
      : product.stock < 5
        ? "border-foreground bg-background text-foreground"
        : "border-border bg-background text-foreground";
  const shipEstimate = "Estimated delivery 2-5 days";
  const freeShippingThreshold = 100;
  const workingSubtotal = product.price * quantity;
  const freeShippingRemaining = Math.max(0, freeShippingThreshold - workingSubtotal);
  const freeShippingProgress = Math.min(100, Math.round((workingSubtotal / freeShippingThreshold) * 100));
  const isAvailable = product.stock > 0;

  const details = product.details ?? [
    "Limited run release",
    "Clean proportion for daily wear",
    "Premium materials",
    "Built for repeat use",
  ];
  const detailHighlights = details.slice(0, 6);
  const extraSpecs = details.slice(6);
  const extraSpecsDisplay = extraSpecs.slice(0, 12);
  const extraSpecsRemaining = Math.max(0, extraSpecs.length - extraSpecsDisplay.length);
  const detailText = details.join(" ").toLowerCase();
  const materialLabel = detailText.includes("cotton")
    ? "Cotton"
    : detailText.includes("fleece")
      ? "Fleece blend"
      : "Premium blend";
  const printLabel = detailText.includes("dtg")
    ? "DTG print"
    : detailText.includes("embroidery")
      ? "Embroidery"
      : "Direct print";
  const finishLabel =
    detailText.includes("garment") && detailText.includes("dyed")
      ? "Garment dyed"
      : "Standard finish";
  const weightLabel = detailText.includes("heavyweight")
    ? "Heavyweight"
    : detailText.includes("midweight")
      ? "Midweight"
      : "Standard weight";
  const fitLabel = isBottom
    ? "Relaxed taper"
    : isCap
      ? "Adjustable fit"
      : "Relaxed fit";
  const specRows = [
    { label: "Fit", value: fitLabel },
    { label: "Material", value: materialLabel },
    { label: "Weight", value: weightLabel },
    { label: "Print", value: printLabel },
    { label: "Finish", value: finishLabel },
    { label: "Care", value: "See garment label" },
  ];

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, startRotation: pendingRotationRef.current };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const scheduleRotationUpdate = (nextValue: number) => {
    pendingRotationRef.current = clampRotation(nextValue);
    if (rotationFrameRef.current !== null) return;
    rotationFrameRef.current = window.requestAnimationFrame(() => {
      rotationFrameRef.current = null;
      setRotation(pendingRotationRef.current);
    });
  };

  const flushRotationUpdate = () => {
    if (rotationFrameRef.current === null) return;
    window.cancelAnimationFrame(rotationFrameRef.current);
    rotationFrameRef.current = null;
    setRotation(pendingRotationRef.current);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const delta = event.clientX - dragRef.current.startX;
    scheduleRotationUpdate(dragRef.current.startRotation + delta * 0.7);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    flushRotationUpdate();
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const handleZoomMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 8, 92);
    const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 8, 92);
    setZoomOrigin(`${x}% ${y}%`);
    setLensPosition({ x, y });
  };

  const nextImage = () => {
    if (!galleryImages.length) return;
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const prevImage = () => {
    if (!galleryImages.length) return;
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const addCurrentToCart = () => {
    if (!isAvailable) return;
    add({
      id: product.id,
      name: product.name,
      price: product.price,
      image: activeImage || product.image,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      quantity,
      printify: product.printify
        ? {
            productId: product.id,
            variantId: selectedVariant?.id,
            blueprintId: product.printify.blueprintId,
            printProviderId: product.printify.printProviderId,
          }
        : undefined,
    });
    toast("Added to cart.");
    trackConversionEvent("pdp_add_to_cart", { productId: product.id });
  };

  const handleCheckoutNow = () => {
    if (!isAvailable) return;
    addCurrentToCart();
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12 pb-28 md:pb-12">
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
          <Link to="/shop" className="hover:text-foreground focus-visible:text-foreground">
            Shop
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-none border bg-card p-4">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                    <button
                      type="button"
                      onClick={() => setViewMode("360")}
                  className={
                    viewMode === "360"
                      ? "rounded-none border border-primary bg-primary px-4 py-2 text-primary-foreground"
                      : "rounded-none border border-border bg-background px-4 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  }
                    >
                      360
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("gallery")}
                  className={
                    viewMode === "gallery"
                      ? "rounded-none border border-primary bg-primary px-4 py-2 text-primary-foreground"
                      : "rounded-none border border-border bg-background px-4 py-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  }
                    >
                      Gallery
                    </button>
                  </div>

              {viewMode === "360" ? (
                <>
                  <div
                    className="relative overflow-hidden rounded-none border border-border bg-background"
                  >
                    <div
                      className="relative flex h-[420px] select-none items-center justify-center md:h-[520px] cursor-grab active:cursor-grabbing touch-none"
                      style={{ perspective: "1200px" }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={() => {
                        setDragging(false);
                        flushRotationUpdate();
                      }}
                    >
                      <div
                        className={`relative aspect-square w-[82%] max-w-[440px] ${
                          dragging ? "" : "transition-transform duration-200"
                        }`}
                        style={{
                          transform: `rotateY(${rotation}deg)`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <div
                          className="absolute inset-0"
                          style={{ backfaceVisibility: "hidden" }}
                        >
                          <img
                            src={frontVisual}
                            alt={`${product.name} front`}
                            className="h-full w-full object-contain shadow-elev-1"
                            draggable={false}
                            decoding="async"
                            onError={(event) => withImageFallback(event, frontMockup)}
                          />
                          {shouldTint ? (
                            <div
                              className="absolute inset-0 mix-blend-multiply opacity-35"
                              style={{ backgroundColor: selectedColorHex }}
                            />
                          ) : null}
                        </div>
                        <div
                          className="absolute inset-0"
                          style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                        >
                          <img
                            src={backVisual}
                            alt={`${product.name} back`}
                            className="h-full w-full object-contain shadow-elev-1"
                            draggable={false}
                            decoding="async"
                            onError={(event) => withImageFallback(event, backMockup)}
                          />
                          {shouldTint ? (
                            <div
                              className="absolute inset-0 mix-blend-multiply opacity-35"
                              style={{ backgroundColor: selectedColorHex }}
                            />
                          ) : null}
                        </div>
                      </div>

                      <div className="absolute left-4 top-4 rounded-none border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        360 View
                      </div>
                      <div className="absolute bottom-4 left-4 rounded-none border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Drag to rotate
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Rotation</span>
                    <input
                      type="range"
                      min={0}
                      max={360}
                      value={rotation}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        pendingRotationRef.current = next;
                        setRotation(next);
                      }}
                      className="flex-1 accent-primary"
                    />
                    <span className="min-w-[40px] text-right">{Math.round(rotation)}°</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="group relative overflow-hidden rounded-none border border-border bg-background"
                    onMouseMove={handleZoomMove}
                    onMouseEnter={() => setLensVisible(true)}
                    onMouseLeave={() => {
                      setZoomOrigin("50% 50%");
                      setLensVisible(false);
                    }}
                  >
                    <div className="relative flex h-[420px] items-center justify-center md:h-[520px]">
                      <img
                        src={activeImage}
                        alt={product.name}
                        className="h-full w-full object-contain"
                        style={{ transformOrigin: zoomOrigin }}
                        draggable={false}
                        decoding="async"
                        onError={(event) => withImageFallback(event, heroImage)}
                      />
                      {selectedColorHex ? (
                        <div
                          className="absolute inset-0 mix-blend-multiply opacity-35"
                          style={{ backgroundColor: selectedColorHex }}
                        />
                      ) : null}
                      {lensVisible ? (
                        <div
                          className="pointer-events-none absolute h-40 w-40 rounded-none border border-foreground/50 shadow-none"
                          style={{
                            left: `${lensPosition.x}%`,
                            top: `${lensPosition.y}%`,
                            transform: "translate(-50%, -50%)",
                            backgroundImage: `url(${activeImage})`,
                            backgroundSize: "220% 220%",
                            backgroundPosition: zoomOrigin,
                          }}
                        />
                      ) : null}
                      <div className="absolute left-4 top-4 rounded-none border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Gallery
                      </div>
                      <div className="absolute bottom-4 left-4 rounded-none border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Hover to zoom
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGalleryOpen(true)}
                        className="absolute right-4 top-4 rounded-none border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        Expand
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {galleryImages.map((image, index) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        className={`relative overflow-hidden rounded-none border ${
                          index === activeImageIndex
                            ? "border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          className="h-20 w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(event) => withImageFallback(event, heroImage)}
                        />
                        {selectedColorHex ? (
                          <div
                            className="absolute inset-0 mix-blend-multiply opacity-25"
                            style={{ backgroundColor: selectedColorHex }}
                          />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-none border bg-card p-6">
              <div className="flex items-center justify-between">
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Product Details
                </div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {details.length} specs
                </span>
              </div>
              <div className="mt-4 grid gap-6 lg:grid-cols-[1.25fr_0.9fr]">
                <div className="space-y-4">
                  <div className="rounded-none border bg-background/40 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Build Highlights
                    </div>
                    <ul className="mt-3 space-y-3">
                      {detailHighlights.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-3 text-sm text-muted-foreground"
                        >
                          <span className="mt-2 h-1.5 w-1.5 rounded-none bg-primary/80" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {extraSpecsDisplay.length ? (
                    <div className="rounded-none border bg-background/30 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        More Specs
                      </div>
                      <ul className="mt-3 divide-y divide-border/50 rounded-none border border-border/60 bg-background/60 px-3">
                        {extraSpecsDisplay.map((spec) => (
                          <li
                            key={spec}
                            className="py-2 text-sm text-muted-foreground"
                          >
                            {spec}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {extraSpecsRemaining ? (
                          <span>
                            +{extraSpecsRemaining} more
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4">
                  {bundleItems.length ? (
                    <div className="rounded-none border bg-secondary/40 p-4">
                      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        <span>Pair with</span>
                        <span className="text-foreground">{bundleCount + 1} items</span>
                      </div>
                      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-3 rounded-none border bg-background/70 p-3">
                          <input type="checkbox" checked readOnly />
                          <div className="h-12 w-12 overflow-hidden rounded-none border bg-muted">
                            <img
                              src={heroImage}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              decoding="async"
                              onError={(event) => withImageFallback(event, product.image)}
                            />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                              Current selection
                            </p>
                            <p className="text-sm text-foreground">{product.name}</p>
                          </div>
                          <span className="text-xs font-mono text-primary">
                            {formatMoney(product.price)}
                          </span>
                        </div>
                        {bundleItems.map((item) => (
                          <label
                            key={item.id}
                            className="flex items-center gap-3 rounded-none border bg-background/60 p-3"
                          >
                            <input
                              type="checkbox"
                              checked={!!bundleSelection[item.id]}
                              onChange={(event) =>
                                setBundleSelection((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.checked,
                                }))
                              }
                            />
                            <div className="h-12 w-12 overflow-hidden rounded-none border bg-muted">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                decoding="async"
                                onError={(event) => withImageFallback(event, product.image)}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{item.name}</p>
                              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                                {item.drop ?? "Limited release"}
                              </p>
                            </div>
                            <span className="text-xs font-mono text-primary">
                              {formatMoney(item.price)}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Bundle total
                        </span>
                        <span className="font-mono text-sm text-primary">
                          {formatMoney(bundleTotal)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="mt-4 w-full rounded-none border border-primary bg-primary px-4 py-2 text-[10px] font-body font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-background hover:text-primary hover:border-primary"
                        onClick={() => {
                          add({
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            image: heroImage || product.image,
                            size: selectedSize || undefined,
                            color: selectedColor || undefined,
                            quantity,
                            printify: product.printify
                              ? {
                                  productId: product.id,
                                  variantId: selectedVariant?.id,
                                  blueprintId: product.printify.blueprintId,
                                  printProviderId: product.printify.printProviderId,
                                }
                              : undefined,
                          });
                          bundleItems.forEach((item) => {
                            if (!bundleSelection[item.id]) return;
                            const bundleVariant =
                              item.printify?.variants?.find((variant) => variant.isEnabled ?? true) ??
                              item.printify?.variants?.[0];
                            add({
                              id: item.id,
                              name: item.name,
                              price: item.price,
                              image: item.image,
                              size: item.sizes?.[0],
                              color: item.colors?.[0]?.name,
                              printify: item.printify
                                ? {
                                    productId: item.id,
                                    variantId: bundleVariant?.id,
                                    blueprintId: item.printify.blueprintId,
                                    printProviderId: item.printify.printProviderId,
                                  }
                                : undefined,
                            });
                          });
                          toast("Bundle added to cart");
                        }}
                      >
                        Add selected
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-none border bg-secondary/40 p-4">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Fit & Care Snapshot
                      </div>
                      <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                        {specRows.slice(0, 3).map((row) => (
                          <div key={row.label} className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                              {row.label}
                            </span>
                            <span className="text-sm text-foreground">{row.value}</span>
                          </div>
                        ))}
                        <div className="rounded-none border border-dashed border-border/70 bg-background/70 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          Related items appear here when available.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="rounded-none border bg-background/30 p-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      Quick Specs
                    </div>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                      {specRows.map((row) => (
                        <div key={row.label} className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                            {row.label}
                          </span>
                          <span className="text-sm text-foreground">{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-[112px] lg:self-start">
            <div className="rounded-none border bg-card p-6">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {product.drop ?? "Collection"}
              </p>
              <h1 className="mt-3 font-heading text-3xl font-bold uppercase leading-[0.94] tracking-[0.1em]">
                {product.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                {reviewSummary.loading ? (
                  <span>Loading reviews</span>
                ) : reviewSummary.total > 0 ? (
                  <>
                    <span className="border border-border bg-background px-3 py-1 text-foreground">
                      {reviewSummary.averageRating.toFixed(1)} / 5
                    </span>
                    <span>{reviewSummary.total} verified reviews</span>
                  </>
                ) : (
                  <span>No verified reviews yet</span>
                )}
              </div>
              <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-border pt-4">
                <span className="font-mono text-3xl font-semibold uppercase tracking-[0.08em] text-foreground">
                  {formatMoney(product.price)}
                </span>
                <div className="flex flex-wrap gap-2">
                  <span className={`border px-3 py-1 text-[10px] font-mono uppercase tracking-widest ${stockTone}`}>
                    {stockLabel}
                  </span>
                  {isNew ? (
                    <span className="border border-border bg-background px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground">
                      New
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className={`rounded-none border px-3 py-3 ${stockTone}`}>
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em]">Status</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider">{stockLabel}</p>
                  <p className="mt-1 text-[11px] opacity-80">Current catalog availability.</p>
                </div>
                <div className="rounded-none border border-border/60 bg-background/30 px-3 py-3 text-muted-foreground">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em]">Shipping</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                    {shipEstimate}
                  </p>
                  <p className="mt-1 text-[11px]">Free shipping over {formatMoney(freeShippingThreshold)}.</p>
                </div>
                <div className="rounded-none border border-border/60 bg-background/30 px-3 py-3 text-muted-foreground">
                  <p className="text-[10px] font-mono uppercase tracking-[0.18em]">Returns</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-foreground">
                    30-day defect support
                  </p>
                  <p className="mt-1 text-[11px]">Replacement or reprint for approved order issues</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {productDescription}
              </p>

              {product.colors?.length ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Color</span>
                    <span className="text-foreground">{selectedColor}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.colors.map((color) => {
                      const active = color.name === selectedColor;
                      const disabled =
                        availableColorNames.size > 0 && !availableColorNames.has(color.name);
                      return (
                        <button
                          key={color.name}
                          type="button"
                          onClick={() => setSelectedColor(color.name)}
                          disabled={disabled}
                          className={`flex min-h-11 items-center gap-2 border px-3 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : disabled
                                ? "cursor-not-allowed border-border bg-card text-muted-foreground/40"
                                : "border-border bg-background text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                          }`}
                        >
                          <span
                            className="h-3.5 w-3.5 rounded-none border border-background/40"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {product.sizes?.length ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
                    <span>Size</span>
                    <span className="text-foreground">{selectedSize || "Select"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.sizes.map((size) => {
                      const active = size === selectedSize;
                      const disabled = availableSizes.size > 0 && !availableSizes.has(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          disabled={disabled}
                          className={`min-h-11 border px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors duration-150 focus-visible:outline-none ${
                            active
                              ? "border-foreground bg-foreground text-background"
                              : disabled
                                ? "cursor-not-allowed border-border bg-card text-muted-foreground/40"
                                : "border-border bg-background text-foreground hover:border-foreground hover:bg-foreground hover:text-background"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="border border-border bg-background px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground focus-visible:border-foreground focus-visible:text-foreground">
                      Size guide
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-none border border-border bg-card">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-xl uppercase tracking-widest">
                        Size & Fit
                      </DialogTitle>
                      <DialogDescription>
                        Use the on-page size chart image for exact measurements before checkout.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-6 grid gap-6">
                      <div className="rounded-none border bg-background/40 p-4">
                        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          Fit Notes
                        </div>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          {fitNotes.map((note) => (
                            <li key={note}>{note}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="rounded-none border bg-background/40 p-4">
                        <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-muted-foreground">
                          <span>Size Guide</span>
                          <span className="text-foreground">{product.name}</span>
                        </div>
                        <div className="mt-3 overflow-x-auto rounded-none border bg-card">
                          <table className="min-w-full text-left text-xs">
                            <thead className="bg-secondary">
                              <tr>
                                {sizeGuide.columns.map((column) => (
                                  <th
                                    key={column.key}
                                    className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
                                  >
                                    {column.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sizeGuide.rows.map((row) => (
                                <tr key={row.size} className="border-t">
                                  {sizeGuide.columns.map((column) => (
                                    <td key={column.key} className="px-4 py-2 text-muted-foreground">
                                      {row[column.key] ?? "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {sizeGuide.note ? (
                          <p className="mt-3 text-xs text-muted-foreground">{sizeGuide.note}</p>
                        ) : null}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-[148px_minmax(0,1fr)_minmax(0,1fr)]">
                <div className="inline-flex h-12 items-stretch border border-border">
                  <button
                    type="button"
                    className="flex h-full w-12 items-center justify-center border-r border-border bg-background text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={!isAvailable}
                  >
                    -
                  </button>
                  <input
                    className="h-full min-w-0 flex-1 border-0 bg-card text-center font-mono text-sm text-foreground focus:outline-none"
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(Math.max(1, Number(event.target.value) || 1))
                    }
                    aria-label="Quantity"
                    disabled={!isAvailable}
                  />
                  <button
                    type="button"
                    className="flex h-full w-12 items-center justify-center border-l border-border bg-background text-foreground transition-colors duration-150 hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
                    onClick={() => setQuantity((current) => current + 1)}
                    disabled={!isAvailable}
                  >
                    +
                  </button>
                </div>
                <button
                  className="h-12 border border-primary bg-primary px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-colors duration-150 hover:bg-background hover:text-primary hover:border-primary focus-visible:bg-background focus-visible:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={addCurrentToCart}
                  disabled={!isAvailable}
                >
                  Add To Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutNow}
                  className="inline-flex h-12 items-center justify-center border border-border bg-background px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!isAvailable}
                >
                  Check Out
                </button>
              </div>

              <div className="mt-4 rounded-none border border-border/60 bg-background/40 p-4">
                <div className="grid gap-2 text-[11px] font-mono uppercase tracking-token-label text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
                    <span>Secure Stripe checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 text-foreground" />
                    <span>{shipEstimate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>30-day defect support</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-none border border-border/60 bg-background/40 p-4">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Free shipping progress</span>
                  <span className="text-foreground">{freeShippingProgress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-none bg-border/70">
                  <div
                    className="h-full rounded-none bg-primary transition-[width] duration-300"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {freeShippingRemaining > 0
                    ? `Add ${formatMoney(freeShippingRemaining)} more to unlock free standard shipping.`
                    : "Free shipping unlocked for this item selection."}
                </p>
              </div>
            </div>

            <div className="rounded-none border bg-card p-6">
              <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Shipping & Returns
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Free standard shipping over $100. Production usually begins within{" "}
                {legal.shippingPolicy.processingWindowBusinessDays}. Approved damage, defect, or
                wrong-item claims can be reported within {legal.returnPolicy.defectReportWindowDays}{" "}
                days of delivery.
              </p>
            </div>
          </div>
        </div>

        {relatedItems.length ? (
          <div className="mt-12">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-widest text-foreground">
                Related Items
              </h2>
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-xs text-muted-foreground">
                {relatedItems.length} picks
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedItems.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        ) : null}
      </main>
      <Footer />

      {product.stock > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background px-4 py-3 md:hidden">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                {selectedColor || "Default color"}
                {selectedSize ? ` · ${selectedSize}` : ""}
              </p>
              <p className="font-mono text-sm text-foreground">{formatMoney(product.price * quantity)}</p>
            </div>
            <button
              type="button"
              onClick={addCurrentToCart}
              className="border border-primary bg-primary px-4 py-2 text-[11px] font-mono font-semibold uppercase tracking-[0.24em] text-primary-foreground transition-colors duration-150 hover:bg-background hover:text-primary hover:border-primary"
            >
              Add to Cart
            </button>
          </div>
        </div>
      ) : null}

      {isGalleryOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-background px-4 py-12">
          <div className="mx-auto w-full max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Gallery
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-widest">
                  {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(false)}
                className="border border-border bg-background px-3 py-2 text-xs font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-none border bg-card p-6">
              <img
                src={activeImage}
                alt={product.name}
                className="max-h-[70vh] w-full object-contain"
                decoding="async"
                onError={(event) => withImageFallback(event, heroImage)}
              />
              <button
                type="button"
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 border border-border bg-background p-2 text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 border border-border bg-background p-2 text-muted-foreground transition-colors duration-150 hover:border-foreground hover:text-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {galleryImages.length ? (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative overflow-hidden rounded-none border ${
                      index === activeImageIndex
                        ? "border-foreground"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="h-20 w-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => withImageFallback(event, heroImage)}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Product;

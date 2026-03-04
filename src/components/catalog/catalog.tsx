import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { products as fallbackProducts, type Product, type ProductColor } from "@/data/products";
import { mergeProductsByName } from "@/lib/mergeProducts";

type PrintifyOptionValue = {
  id: number;
  title: string;
  colors?: string[];
};

type PrintifyOption = {
  name: string;
  type: "color" | "size" | string;
  values?: PrintifyOptionValue[];
};

type PrintifyVariant = {
  id?: number;
  price?: number;
  is_enabled?: boolean;
  is_available?: boolean;
  options?: number[];
};

type PrintifyImage = {
  src: string;
  variant_ids?: number[];
  is_default?: boolean;
  position?: string;
  order?: number | null;
};

type PrintifyViewFile = {
  src?: string;
  variant_ids?: number[];
};

type PrintifyView = {
  position?: string;
  files?: PrintifyViewFile[];
};

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  options?: PrintifyOption[];
  variants?: PrintifyVariant[];
  images?: PrintifyImage[];
  views?: PrintifyView[];
  visible?: boolean;
  is_locked?: boolean;
  created_at?: string;
  blueprint_id?: number;
  print_provider_id?: number;
};

type InventoryFile = {
  updatedAt?: string;
  shopId?: string;
  products?: PrintifyProduct[];
};

type CatalogState = {
  products: Product[];
  loading: boolean;
  syncing: boolean;
  source: "printify" | "static";
  refreshedAt?: string;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogState | null>(null);
const CATALOG_CACHE_KEY = "looksmax.catalog.v1";
const FALLBACK_PRODUCTS = mergeProductsByName(fallbackProducts);
const INVENTORY_MEMORY_CACHE = new Map<string, Product[]>();

type CatalogCache = {
  updatedAt?: string;
  products: Product[];
};

const stripHtml = (value?: string) =>
  value ? value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() : "";

const baseTitle = (title: string) => title.split("|")[0]?.trim() ?? title.trim();

const normalizeKey = (title: string) =>
  baseTitle(title).toLowerCase().replace(/\s+/g, " ").trim();

const toCategory = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes("hoodie")) return "hoodies";
  if (lower.includes("tee") || lower.includes("shirt")) return "tees";
  if (lower.includes("pant") || lower.includes("cargo") || lower.includes("short")) return "bottoms";
  if (lower.includes("jacket") || lower.includes("outerwear")) return "outerwear";
  if (lower.includes("cap") || lower.includes("hat")) return "accessories";
  return undefined;
};

const unique = <T,>(items: T[]) => Array.from(new Set(items));

const mapPrintifyProduct = (product: PrintifyProduct): Product => {
  const options = product.options ?? [];
  const variants = product.variants ?? [];
  const images = product.images ?? [];

  const enabledVariants = variants.filter((variant) =>
    variant.is_enabled ?? variant.is_available ?? true
  );
  const variantsForPricing = enabledVariants.length ? enabledVariants : variants;
  const minPrice =
    variantsForPricing
      .map((variant) => variant.price ?? 0)
      .filter((price) => price > 0)
      .sort((a, b) => a - b)[0] ?? 0;

  const enabledOptionIds = new Set(
    enabledVariants.flatMap((variant) => variant.options ?? [])
  );

  const colors: ProductColor[] =
    options
      .filter((opt) => opt.type === "color")
      .flatMap((opt) => opt.values ?? [])
      .filter((value) => (enabledOptionIds.size ? enabledOptionIds.has(value.id) : true))
      .map((value) => ({
        name: value.title,
        hex: value.colors?.[0] ?? "#111111",
      })) ?? [];

  const sizes =
    options
      .filter((opt) => opt.type === "size")
      .flatMap((opt) => opt.values ?? [])
      .filter((value) => (enabledOptionIds.size ? enabledOptionIds.has(value.id) : true))
      .map((value) => value.title) ?? [];

  const sortedImages = [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const gallery = unique(sortedImages.map((img) => img.src).filter(Boolean));
  const primaryImage =
    images.find((img) => img.is_default) ??
    images.find((img) => img.position === "front") ??
    images[0];

  const colorOptions =
    options
      .filter((opt) => opt.type === "color")
      .flatMap((opt) => opt.values ?? [])
      .filter(Boolean) ?? [];

  const colorById = new Map(colorOptions.map((color) => [color.id, color.title]));
  const colorOptionIds = new Set(colorOptions.map((color) => color.id));

  const sizeOptions =
    options
      .filter((opt) => opt.type === "size")
      .flatMap((opt) => opt.values ?? [])
      .filter(Boolean) ?? [];
  const sizeById = new Map(sizeOptions.map((size) => [size.id, size.title]));
  const sizeOptionIds = new Set(sizeOptions.map((size) => size.id));

  const variantToColor = new Map<number, string>();
  variants.forEach((variant) => {
    if (!variant.id || !variant.options?.length) return;
    const colorId = variant.options.find((optionId) => colorOptionIds.has(optionId));
    if (!colorId) return;
    const colorName = colorById.get(colorId);
    if (colorName) variantToColor.set(variant.id, colorName);
  });

  const colorImageMap: Record<string, string[]> = {};
  sortedImages.forEach((image) => {
    if (!image.src || !image.variant_ids?.length) return;
    const colorNames = new Set<string>();
    image.variant_ids.forEach((variantId) => {
      const colorName = variantToColor.get(variantId);
      if (colorName) colorNames.add(colorName);
    });
    colorNames.forEach((colorName) => {
      if (!colorImageMap[colorName]) colorImageMap[colorName] = [];
      if (!colorImageMap[colorName].includes(image.src)) {
        colorImageMap[colorName].push(image.src);
      }
    });
  });

  const viewerCount = 12;

  const viewFiles = Array.isArray(product.views) ? product.views : [];
  const frontView = viewFiles.find((view) => view.position === "front")?.files?.[0]?.src;
  const backView = viewFiles.find((view) => view.position === "back")?.files?.[0]?.src;
  const viewImages =
    frontView || backView
      ? {
          front: frontView,
          back: backView,
        }
      : undefined;

  const variantMap = variants
    .filter((variant) => typeof variant.id === "number")
    .map((variant) => {
      const optionIds = variant.options ?? [];
      const colorId = optionIds.find((optionId) => colorOptionIds.has(optionId));
      const sizeId = optionIds.find((optionId) => sizeOptionIds.has(optionId));
      return {
        id: variant.id as number,
        price: variant.price,
        isEnabled: variant.is_enabled ?? variant.is_available ?? true,
        color: colorId ? colorById.get(colorId) : undefined,
        size: sizeId ? sizeById.get(sizeId) : undefined,
      };
    });

  const createdAt = (() => {
    if (!product.created_at) return undefined;
    const parsed = Date.parse(product.created_at);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : undefined;
  })();

  return {
    id: product.id,
    name: baseTitle(product.title),
    price: minPrice ? minPrice / 100 : 0,
    image: primaryImage?.src ?? "/mockups/product-fallback.svg",
    stock: enabledVariants.length || variants.length || 0,
    viewers: viewerCount,
    sizes: unique(sizes),
    colors: unique(colors.map((color) => color.name)).map((name) => {
      const match = colors.find((color) => color.name === name);
      return match ?? { name, hex: "#111111" };
    }),
    description: stripHtml(product.description),
    details: product.tags?.length ? product.tags : undefined,
    drop: product.visible ? "Available now" : "Preview",
    source: "printify",
    status: product.visible ? "live" : "draft",
    category: toCategory(product.title),
    createdAt,
    gallery,
    colorImageMap: Object.keys(colorImageMap).length ? colorImageMap : undefined,
    views: viewImages,
    printify: {
      blueprintId: product.blueprint_id,
      printProviderId: product.print_provider_id,
      variants: variantMap.length ? variantMap : undefined,
    },
  };
};

const mapInventory = (file: InventoryFile | null): Product[] => {
  if (!file?.products?.length) return [];
  const groups = new Map<
    string,
    Array<{ raw: PrintifyProduct; mapped: Product; baseName: string }>
  >();

  file.products.forEach((product) => {
    const key = normalizeKey(product.title);
    const mapped = mapPrintifyProduct(product);
    const entry = { raw: product, mapped, baseName: baseTitle(product.title) };
    if (!groups.has(key)) {
      groups.set(key, [entry]);
    } else {
      groups.get(key)?.push(entry);
    }
  });

  return Array.from(groups.values()).map((entries) => {
    if (entries.length === 1) return entries[0].mapped;
    const sorted = [...entries].sort((a, b) => {
      const aTime = a.raw.created_at ? Date.parse(a.raw.created_at) : 0;
      const bTime = b.raw.created_at ? Date.parse(b.raw.created_at) : 0;
      return aTime - bTime;
    });
    const primary = sorted[0].mapped;
    const primaryBaseName = sorted[0].baseName || primary.name;

    const mergedColors: ProductColor[] = [];
    sorted.forEach(({ mapped }) => {
      mapped.colors?.forEach((color) => {
        if (!mergedColors.some((item) => item.name === color.name)) {
          mergedColors.push(color);
        }
      });
    });

    const mergedSizes = unique(sorted.flatMap(({ mapped }) => mapped.sizes ?? []));

    const mergedGallery = unique(
      sorted.flatMap(({ mapped }) => mapped.gallery ?? []).concat(primary.image ? [primary.image] : [])
    );
    const mergedViews = sorted.reduce(
      (acc, { mapped }) => {
        if (!acc.front && mapped.views?.front) acc.front = mapped.views.front;
        if (!acc.back && mapped.views?.back) acc.back = mapped.views.back;
        return acc;
      },
      { ...(primary.views ?? {}) } as { front?: string; back?: string }
    );

    const mergedColorImageMap: Record<string, string[]> = {};
    sorted.forEach(({ mapped }) => {
      if (!mapped.colorImageMap) return;
      Object.entries(mapped.colorImageMap).forEach(([color, images]) => {
        if (!mergedColorImageMap[color]) mergedColorImageMap[color] = [];
        images.forEach((img) => {
          if (!mergedColorImageMap[color].includes(img)) {
            mergedColorImageMap[color].push(img);
          }
        });
      });
    });

    const mergedVariants = new Map<
      number,
      {
        id: number;
        price?: number;
        isEnabled?: boolean;
        color?: string;
        size?: string;
      }
    >();
    sorted.forEach(({ mapped }) => {
      mapped.printify?.variants?.forEach((variant) => {
        if (!mergedVariants.has(variant.id)) {
          mergedVariants.set(variant.id, variant);
        }
      });
    });

    const mergedPrintify =
      mergedVariants.size || sorted.some(({ mapped }) => mapped.printify?.blueprintId)
        ? {
            blueprintId:
              primary.printify?.blueprintId ??
              sorted.find(({ mapped }) => mapped.printify?.blueprintId)?.printify?.blueprintId,
            printProviderId:
              primary.printify?.printProviderId ??
              sorted.find(({ mapped }) => mapped.printify?.printProviderId)?.printify
                ?.printProviderId,
            variants: mergedVariants.size
              ? Array.from(mergedVariants.values())
              : primary.printify?.variants,
          }
        : primary.printify;

    const mergedPrices = sorted.map(({ mapped }) => mapped.price).filter((val) => val > 0);
    const price = mergedPrices.length ? Math.min(...mergedPrices) : primary.price;

    const stock = Math.max(...sorted.map(({ mapped }) => mapped.stock), primary.stock);
    const viewers = Math.max(...sorted.map(({ mapped }) => mapped.viewers), primary.viewers);
    const status = sorted.some(({ mapped }) => mapped.status === "live") ? "live" : "draft";
    const mergedCreatedAt = sorted
      .map(({ mapped }) => mapped.createdAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

    return {
      ...primary,
      name: primaryBaseName,
      price,
      stock,
      viewers,
      sizes: mergedSizes.length ? mergedSizes : primary.sizes,
      colors: mergedColors.length ? mergedColors : primary.colors,
      gallery: mergedGallery.length ? mergedGallery : primary.gallery,
      views: mergedViews.front || mergedViews.back ? mergedViews : primary.views,
      printify: mergedPrintify,
      colorImageMap: Object.keys(mergedColorImageMap).length
        ? mergedColorImageMap
        : primary.colorImageMap,
      status,
      drop: status === "live" ? "Available now" : "Preview",
      createdAt: mergedCreatedAt ?? primary.createdAt,
      aliases: sorted.slice(1).map(({ mapped }) => mapped.id),
    };
  });
};

const readCatalogCache = (): CatalogCache | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CATALOG_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CatalogCache) : null;
    if (!parsed || !Array.isArray(parsed.products) || !parsed.products.length) return null;
    return parsed;
  } catch {
    return null;
  }
};

const writeCatalogCache = (cache: CatalogCache) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore cache write failures
  }
};

export const CatalogProvider = ({ children }: { children: React.ReactNode }) => {
  const initialCache = useMemo(() => readCatalogCache(), []);
  const hasInitialCache = Boolean(initialCache?.products?.length);
  const [products, setProducts] = useState<Product[]>(() =>
    hasInitialCache ? initialCache!.products : FALLBACK_PRODUCTS
  );
  const [loading, setLoading] = useState(!hasInitialCache);
  const [syncing, setSyncing] = useState(false);
  const [source, setSource] = useState<CatalogState["source"]>(
    hasInitialCache ? "printify" : "static"
  );
  const [refreshedAt, setRefreshedAt] = useState<string | undefined>(initialCache?.updatedAt);
  const mounted = useRef(true);
  const inFlightRequest = useRef<AbortController | null>(null);
  const cacheRef = useRef<CatalogCache | null>(initialCache);

  const persistCache = useCallback((cache: CatalogCache) => {
    cacheRef.current = cache;
    writeCatalogCache(cache);
  }, []);

  useEffect(() => {
    return () => {
      mounted.current = false;
      inFlightRequest.current?.abort();
    };
  }, []);

  const loadInventory = useCallback(
    async (mode: "initial" | "refresh") => {
      const controller = new AbortController();
      inFlightRequest.current?.abort();
      inFlightRequest.current = controller;

      if (mode === "initial") {
        setLoading(true);
      } else {
        setSyncing(true);
      }
      try {
        const res = await fetch("/inventory.json", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("inventory fetch failed");
        const file = (await res.json()) as InventoryFile;
        const cached = cacheRef.current;
        const cacheKey = file.updatedAt ?? "";
        const memoized = cacheKey ? INVENTORY_MEMORY_CACHE.get(cacheKey) : undefined;
        const mappedFromInventory = memoized ?? mergeProductsByName(mapInventory(file));
        if (cacheKey && !memoized) {
          INVENTORY_MEMORY_CACHE.set(cacheKey, mappedFromInventory);
        }
        const mapped =
          cached?.updatedAt &&
          file.updatedAt &&
          cached.updatedAt === file.updatedAt &&
          cached.products.length
            ? cached.products
            : mappedFromInventory;
        if (!mounted.current) return;
        if (mapped.length) {
          if (!(cached?.updatedAt && file.updatedAt && cached.updatedAt === file.updatedAt)) {
            persistCache({ updatedAt: file.updatedAt, products: mapped });
          }
          setProducts(mapped);
          setSource("printify");
          setRefreshedAt(file.updatedAt);
        } else {
          setProducts(FALLBACK_PRODUCTS);
          setSource("static");
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        if (!mounted.current) return;
        const cached = cacheRef.current;
        if (cached?.products.length) {
          setProducts(cached.products);
          setSource("printify");
          setRefreshedAt(cached.updatedAt);
        } else {
          setProducts(FALLBACK_PRODUCTS);
          setSource("static");
        }
      } finally {
        if (inFlightRequest.current === controller) {
          inFlightRequest.current = null;
        }
        if (mounted.current) {
          if (mode === "initial") {
            setLoading(false);
          } else {
            setSyncing(false);
          }
        }
      }
    },
    [persistCache, setProducts]
  );

  useEffect(() => {
    loadInventory(hasInitialCache ? "refresh" : "initial");
  }, [hasInitialCache, loadInventory]);

  const refresh = useCallback(async () => {
    await loadInventory("refresh");
  }, [loadInventory]);

  const value = useMemo(
    () => ({ products, loading, syncing, source, refreshedAt, refresh }),
    [products, loading, syncing, source, refreshedAt, refresh]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within CatalogProvider");
  return ctx;
};

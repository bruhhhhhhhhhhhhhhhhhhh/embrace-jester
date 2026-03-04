import type { Product, ProductColor } from "@/data/products";

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const unique = <T,>(items: T[]) => Array.from(new Set(items));

export const mergeProductsByName = (items: Product[]) => {
  const groups = new Map<string, Product[]>();

  items.forEach((product) => {
    const source = product.source ?? "static";
    const key =
      source === "printify"
        ? `printify::${normalizeKey(product.name)}`
        : `static::${product.id}`;
    if (!groups.has(key)) {
      groups.set(key, [product]);
    } else {
      groups.get(key)?.push(product);
    }
  });

  return Array.from(groups.values()).map((group) => {
    if (group.length === 1) return group[0];
    const primary = group[0];

    const mergedColors: ProductColor[] = [];
    group.forEach((product) => {
      product.colors?.forEach((color) => {
        if (!mergedColors.some((item) => item.name === color.name)) {
          mergedColors.push(color);
        }
      });
    });

    const mergedSizes = unique(group.flatMap((product) => product.sizes ?? []));
    const mergedGallery = unique(
      group.flatMap((product) => product.gallery ?? []).concat(primary.image ? [primary.image] : [])
    );
    const mergedViews = group.reduce(
      (acc, product) => {
        if (!acc.front && product.views?.front) acc.front = product.views.front;
        if (!acc.back && product.views?.back) acc.back = product.views.back;
        return acc;
      },
      { ...(primary.views ?? {}) } as { front?: string; back?: string }
    );
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
    group.forEach((product) => {
      product.printify?.variants?.forEach((variant) => {
        if (!mergedVariants.has(variant.id)) {
          mergedVariants.set(variant.id, variant);
        }
      });
    });
    const mergedPrintify =
      mergedVariants.size || group.some((product) => product.printify?.blueprintId)
        ? {
            blueprintId:
              primary.printify?.blueprintId ??
              group.find((product) => product.printify?.blueprintId)?.printify?.blueprintId,
            printProviderId:
              primary.printify?.printProviderId ??
              group.find((product) => product.printify?.printProviderId)?.printify
                ?.printProviderId,
            variants: mergedVariants.size
              ? Array.from(mergedVariants.values())
              : primary.printify?.variants,
          }
        : primary.printify;

    const mergedColorImageMap: Record<string, string[]> = {};
    group.forEach((product) => {
      if (!product.colorImageMap) return;
      Object.entries(product.colorImageMap).forEach(([color, images]) => {
        if (!mergedColorImageMap[color]) mergedColorImageMap[color] = [];
        images.forEach((img) => {
          if (!mergedColorImageMap[color].includes(img)) {
            mergedColorImageMap[color].push(img);
          }
        });
      });
    });

    const price = Math.min(
      ...group.map((product) => product.price).filter((value) => value > 0),
      primary.price || 0
    );
    const stock = Math.max(...group.map((product) => product.stock), primary.stock);
    const viewers = Math.max(...group.map((product) => product.viewers), primary.viewers);
    const status = group.some((product) => product.status === "live") ? "live" : primary.status;
    const source = group.some((product) => product.source === "printify")
      ? "printify"
      : primary.source;
    const mergedCreatedAt = group
      .map((product) => product.createdAt)
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0];
    const aliases = unique(
      group
        .map((product) => product.id)
        .filter((id) => id !== primary.id)
        .concat(primary.aliases ?? [])
    );

    return {
      ...primary,
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
      source,
      drop: status === "live" ? (primary.drop ?? "Available now") : (primary.drop ?? "Preview"),
      createdAt: mergedCreatedAt ?? primary.createdAt,
      aliases: aliases.length ? aliases : primary.aliases,
    };
  });
};

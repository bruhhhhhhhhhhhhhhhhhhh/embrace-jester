import fs from "fs/promises";
import path from "path";

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  options?: Array<{
    name?: string;
    type?: string;
    values?: Array<{ id?: number; title?: string; colors?: string[] }>;
  }>;
  variants?: Array<{
    id?: number;
    price?: number;
    is_enabled?: boolean;
    is_available?: boolean;
    options?: number[];
  }>;
  images?: Array<{
    src?: string;
    variant_ids?: number[];
    is_default?: boolean;
    position?: string;
    order?: number | null;
  }>;
  views?: Array<{
    position?: string;
    files?: Array<{ src?: string }>;
  }>;
  created_at?: string;
  visible?: boolean;
  blueprint_id?: number;
  print_provider_id?: number;
};

type PrintifyResponse = {
  data?: PrintifyProduct[];
  current_page?: number;
  last_page?: number;
  next_page_url?: string | null;
  per_page?: number;
};

const REPO_ROOT = path.resolve(process.cwd());
const ENV_PATHS = [".env.local", ".env"];

async function loadEnvFile() {
  for (const filename of ENV_PATHS) {
    const fullPath = path.join(REPO_ROOT, filename);
    try {
      const raw = await fs.readFile(fullPath, "utf-8");
      raw
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#") && line.includes("="))
        .forEach((line) => {
          const [key, ...rest] = line.split("=");
          const value = rest.join("=").replace(/^['"]|['"]$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        });
      return;
    } catch {
      // ignore missing env files
    }
  }
}

async function fetchAllProducts(token: string, shopId: string) {
  const perPage = 50;
  let page = 1;
  const all: PrintifyProduct[] = [];

  while (true) {
    const url = new URL(
      `https://api.printify.com/v1/shops/${shopId}/products.json`
    );
    url.searchParams.set("limit", String(perPage));
    url.searchParams.set("page", String(page));

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "CodexPrintifyClient/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Printify API error ${res.status}: ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as PrintifyResponse;
    const batch = Array.isArray(json.data) ? json.data : [];
    all.push(...batch);

    if (json.next_page_url) {
      page += 1;
      continue;
    }

    if (json.current_page && json.last_page && json.current_page < json.last_page) {
      page += 1;
      continue;
    }

    if (batch.length === perPage) {
      page += 1;
      continue;
    }

    break;
  }

  return all;
}

function compactProduct(product: PrintifyProduct): PrintifyProduct {
  const options = (product.options ?? [])
    .map((option) => {
      const values = (option.values ?? [])
        .map((value) => ({
          id: value.id,
          title: value.title,
          colors: value.colors?.slice(0, 1),
        }))
        .filter((value) => typeof value.id === "number" && Boolean(value.title));

      return {
        name: option.name,
        type: option.type,
        values,
      };
    })
    .filter((option) => Boolean(option.name) && Boolean(option.type) && option.values.length > 0);

  const variants = (product.variants ?? [])
    .map((variant) => ({
      id: variant.id,
      price: variant.price,
      is_enabled: variant.is_enabled,
      is_available: variant.is_available,
      options: variant.options ?? [],
    }))
    .filter(
      (variant) =>
        typeof variant.id === "number" &&
        typeof variant.price === "number" &&
        Array.isArray(variant.options) &&
        variant.options.length > 0
    );

  const images = (product.images ?? [])
    .map((image) => ({
      src: image.src,
      variant_ids: image.variant_ids ?? [],
      is_default: image.is_default,
      position: image.position,
      order: image.order ?? null,
    }))
    .filter((image) => Boolean(image.src));

  const views = (product.views ?? [])
    .filter((view) => view.position === "front" || view.position === "back")
    .map((view) => ({
      position: view.position,
      files: (view.files ?? [])
        .map((file) => ({ src: file.src }))
        .filter((file) => Boolean(file.src))
        .slice(0, 1),
    }))
    .filter((view) => view.files.length > 0);

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    tags: product.tags,
    options,
    variants,
    images,
    views,
    created_at: product.created_at,
    visible: product.visible,
    blueprint_id: product.blueprint_id,
    print_provider_id: product.print_provider_id,
  };
}

async function main() {
  await loadEnvFile();

  const token = process.env.PRINTIFY_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;
  const query = process.env.PRINTIFY_PRODUCT_QUERY ?? "";

  if (!token || !shopId) {
    console.error(
      "Missing PRINTIFY_TOKEN or PRINTIFY_SHOP_ID in environment. Check .env.local."
    );
    process.exit(1);
  }

  const products = await fetchAllProducts(token, shopId);
  const normalized = query.toLowerCase();
  const matched = products
    .filter((product) => product.title?.toLowerCase().includes(normalized))
    .map(compactProduct);

  const inventory = {
    updatedAt: new Date().toISOString(),
    shopId,
    query,
    totalProducts: products.length,
    matchedProducts: matched.length,
    products: matched,
  };

  const outputPath = path.join(REPO_ROOT, "inventory.json");
  await fs.writeFile(outputPath, JSON.stringify(inventory, null, 2));

  const publicPath = path.join(REPO_ROOT, "public", "inventory.json");
  await fs.writeFile(publicPath, JSON.stringify(inventory, null, 2));

  console.log(
    `Saved ${matched.length} product(s) to ${outputPath} and ${publicPath} (query: "${query}")`
  );
}

main().catch((error) => {
  console.error("fetch_products failed:", error);
  process.exit(1);
});

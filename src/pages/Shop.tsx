import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/components/catalog/catalog";
import CatalogStatus from "@/components/catalog/CatalogStatus";
import { getNewProductWindowDays, isNewProduct, toTimestamp } from "@/lib/productFreshness";

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Items",
  new: "New Releases",
  hoodies: "Hoodies",
  tees: "Tees",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  accessories: "Accessories",
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  hoodies: ["hoodie"],
  tees: ["tee"],
  bottoms: ["pants", "short", "cargo", "bottom"],
  outerwear: ["jacket", "outer"],
  accessories: ["cap", "hat", "accessory"],
};

const SHOP_TABS: Array<{ key: string; label: string; href: string }> = [
  { key: "all", label: "All", href: "/shop" },
  { key: "new", label: "New Releases", href: "/shop/new" },
  { key: "hoodies", label: "Hoodies", href: "/shop/hoodies" },
  { key: "tees", label: "Tees", href: "/shop/tees" },
  { key: "bottoms", label: "Bottoms", href: "/shop/bottoms" },
  { key: "outerwear", label: "Outerwear", href: "/shop/outerwear" },
  { key: "accessories", label: "Accessories", href: "/shop/accessories" },
];

const Shop = () => {
  const params = useParams();
  const category = (params.category ?? "all").toLowerCase();
  const { products } = useCatalog();
  const [sort, setSort] = useState<"best-selling" | "newest" | "price-asc" | "price-desc">(
    "best-selling"
  );
  const newestFirst = useMemo(
    () => [...products].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt)),
    [products]
  );

  const filtered = useMemo(() => {
    if (category === "all") return products;
    if (category === "new") {
      if (!newestFirst.length) return [];
      const recent = newestFirst.filter((product) => isNewProduct(product.createdAt));
      if (recent.length) return recent.slice(0, 8);
      return newestFirst.slice(0, 6);
    }
    const hasCategory = products.some((p) => p.category);
    if (hasCategory) {
      return products.filter((p) => p.category === category);
    }
    const keywords = CATEGORY_KEYWORDS[category] ?? [category];
    return products.filter((p) =>
      keywords.some((keyword) => p.name.toLowerCase().includes(keyword))
    );
  }, [category, newestFirst, products]);

  const label = CATEGORY_LABELS[category] ?? "Shop";
  const sortedProducts = useMemo(() => {
    const next = [...filtered];
    if (sort === "newest") {
      next.sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
      return next;
    }
    if (sort === "price-asc") {
      next.sort((a, b) => a.price - b.price);
      return next;
    }
    if (sort === "price-desc") {
      next.sort((a, b) => b.price - a.price);
      return next;
    }
    if (sort === "best-selling") {
      next.sort((a, b) => b.viewers - a.viewers);
      return next;
    }
    return next.sort((a, b) => b.viewers - a.viewers);
  }, [filtered, sort]);
  const sortLabel =
    sort === "best-selling"
      ? "Best-selling"
      : sort === "newest"
        ? "Newest"
        : sort === "price-asc"
          ? "Price low-high"
          : "Price high-low";

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="rounded-xl border border-border/70 bg-card px-5 py-5">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Shop Thread
              </p>
              <div className="mt-2 flex items-start gap-4">
                <div className="mt-1 h-12 w-[3px] rounded-full bg-foreground/80" />
                <div>
                  <h1 className="font-heading text-3xl font-bold uppercase tracking-tight">{label}</h1>
                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                    Browse current threads and sort by release or pricing.
                  </p>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-foreground">
                {sortedProducts.length} products
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {category === "new"
                  ? `Added in the last ${getNewProductWindowDays()} days`
                  : "In stock"}{" "}
                | {sortLabel}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-[118px] lg:self-start">
            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Browse
              </p>
              <nav className="mt-3 grid gap-2">
                {SHOP_TABS.map((tab) => {
                  const active = tab.key === category || (tab.key === "all" && category === "all");
                  return (
                    <Link
                      key={tab.key}
                      to={tab.href}
                      className={
                        active
                          ? "rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-background"
                          : "rounded-md border border-border/70 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      }
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <label className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Sort
                <select
                  className="min-w-[140px] rounded-md border border-border/70 bg-background px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground focus:outline-none"
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "best-selling" | "newest" | "price-asc" | "price-desc")
                  }
                >
                  <option value="best-selling">Best-selling</option>
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: low-high</option>
                  <option value="price-desc">Price: high-low</option>
                </select>
              </label>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Thread Summary
              </p>
              <p className="mt-2 text-xs font-mono uppercase tracking-[0.16em] text-foreground">
                Active: {label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Sort: {sortLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Showing {sortedProducts.length} products
              </p>
            </div>
          </aside>

          <section>
            <CatalogStatus className="mb-8" />
            <div className="mb-6 flex items-center gap-4">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                {label}
              </h2>
              <div className="h-px flex-1 bg-border" />
              <span className="font-mono text-xs text-muted-foreground">
                {sortedProducts.length} threads
              </span>
            </div>

            {sortedProducts.length ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {sortedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-10 text-center">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  No items found
                </p>
                <h3 className="mt-3 font-heading text-2xl font-bold uppercase">
                  Out of Stock
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try another category or check back after the next drop.
                </p>
                <Link
                  to="/shop"
                  className="mt-6 inline-flex items-center justify-center rounded-lg border border-foreground bg-foreground px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
                >
                  View All Items
                </Link>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import NotificationBar from "@/components/NotificationBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/components/catalog/catalog";
import CatalogStatus from "@/components/catalog/CatalogStatus";
import type { Product } from "@/data/products";

const STORAGE_KEY = "looksmax.search.recent";
type SearchEntry = { product: Product; haystack: string };

const Search = () => {
  const { products } = useCatalog();
  const categories = useMemo(
    () =>
      Array.from(
        new Set(products.map((product) => product.category).filter(Boolean))
      ) as string[],
    [products]
  );

  const priceBounds = useMemo(() => {
    if (!products.length) {
      return { min: 0, max: 0 };
    }
    const prices = products.map((product) => product.price);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }, [products]);

  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState(priceBounds.min);
  const [priceMax, setPriceMax] = useState(priceBounds.max);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<"best-selling" | "price-asc" | "price-desc" | "newest">(
    "best-selling"
  );
  const [recent, setRecent] = useState<string[]>([]);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setRecent(JSON.parse(raw));
      }
    } catch {
      // ignore read failures
    }
  }, []);

  useEffect(() => {
    setPriceMin((prev) => (prev === 0 || prev > priceBounds.max ? priceBounds.min : prev));
    setPriceMax((prev) => (prev === 0 || prev < priceBounds.min ? priceBounds.max : prev));
  }, [priceBounds.min, priceBounds.max]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch {
      // ignore write failures
    }
  }, [recent]);

  const pushRecent = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    setRecent((prev) => {
      const next = [cleaned, ...prev.filter((item) => item !== cleaned)];
      return next.slice(0, 6);
    });
  };

  const searchEntries = useMemo<SearchEntry[]>(
    () =>
      products.map((product) => ({
        product,
        haystack: [
          product.name,
          product.description,
          product.details?.join(" "),
          product.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [products]
  );

  const selectedCategorySet = useMemo(
    () => new Set(selectedCategories),
    [selectedCategories]
  );

  const results = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return searchEntries
      .filter(({ product, haystack }) => {
        if (normalized) {
          if (!haystack.includes(normalized)) return false;
        }
        if (selectedCategorySet.size) {
          if (!product.category || !selectedCategorySet.has(product.category)) return false;
        }
        if (product.price < priceMin || product.price > priceMax) return false;
        if (inStockOnly && product.stock < 1) return false;
        return true;
      })
      .sort((a, b) => {
        const left = a.product;
        const right = b.product;
        if (sort === "price-asc") return left.price - right.price;
        if (sort === "price-desc") return right.price - left.price;
        if (sort === "newest") return right.stock - left.stock;
        return right.viewers - left.viewers;
      })
      .map((entry) => entry.product);
  }, [deferredQuery, inStockOnly, priceMax, priceMin, searchEntries, selectedCategorySet, sort]);

  const sortLabel =
    sort === "best-selling"
      ? "Best-selling"
      : sort === "price-asc"
        ? "Price low-high"
        : sort === "price-desc"
          ? "Price high-low"
          : "Newest";
  const categoryLabel = selectedCategories.length
    ? selectedCategories.map((item) => item.replace(/^\w/, (char) => char.toUpperCase())).join(", ")
    : "All categories";
  const hasPriceFilter = priceMin !== priceBounds.min || priceMax !== priceBounds.max;
  const hasActiveFilters =
    Boolean(query.trim()) || Boolean(selectedCategories.length) || hasPriceFilter || inStockOnly;

  return (
    <div className="min-h-screen bg-background">
      <NotificationBar />
      <Header />
      <main className="container mx-auto px-4 py-12">
        <section className="border-b border-border/70 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Search Thread
          </p>
          <h1 className="mt-2 font-heading text-3xl font-bold uppercase tracking-tight">
            Find Your Fit
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Live results update as you filter. Lock in the thread before it sells out.
          </p>

          <form
            className="mt-6 flex flex-wrap items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              pushRecent(query);
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search drops, fits, or keywords"
              className="flex-1 rounded-lg border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="submit"
              className="rounded-lg border border-foreground bg-foreground px-5 py-3 font-mono text-xs font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
              Save Search
            </button>
          </form>

          {recent.length ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>Recent:</span>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="border-b border-transparent pb-0.5 transition-colors hover:border-foreground hover:text-foreground"
                >
                  {term}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <div className="mt-8">
          <CatalogStatus className="mb-8" />
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-6 rounded-xl border border-border/70 bg-card p-6 lg:sticky lg:top-[112px] lg:h-fit">
              <div>
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Categories
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {categories.map((category) => {
                    const active = selectedCategories.includes(category);
                    return (
                      <label key={category} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() =>
                            setSelectedCategories((prev) =>
                              active
                                ? prev.filter((item) => item !== category)
                                : [...prev, category]
                            )
                          }
                        />
                        <span className="capitalize">{category}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Price Range
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                      value={priceMin}
                      min={priceBounds.min}
                      max={priceMax}
                      onChange={(event) => setPriceMin(Number(event.target.value) || priceBounds.min)}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      className="w-full rounded-lg border bg-card px-3 py-2 text-sm"
                      value={priceMax}
                      min={priceMin}
                      max={priceBounds.max}
                      onChange={(event) => setPriceMax(Number(event.target.value) || priceBounds.max)}
                    />
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    ${priceMin} - ${priceMax}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Availability
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(event) => setInStockOnly(event.target.checked)}
                  />
                  In stock only
                </label>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-3">
                <div>
                  <div className="font-heading text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Results
                  </div>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Active: {categoryLabel} | ${priceMin}-${priceMax}
                    {inStockOnly ? " | In stock only" : ""} | {sortLabel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {results.length} threads
                  </span>
                  <label className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                    Sort
                    <select
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-foreground focus:outline-none"
                      value={sort}
                      onChange={(event) =>
                        setSort(event.target.value as "best-selling" | "price-asc" | "price-desc" | "newest")
                      }
                    >
                      <option value="best-selling">Best-selling</option>
                      <option value="price-asc">Price: low-high</option>
                      <option value="price-desc">Price: high-low</option>
                      <option value="newest">Newest</option>
                    </select>
                  </label>
                </div>
              </div>

              {hasActiveFilters ? (
                <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3 text-[10px] font-mono uppercase tracking-[0.18em]">
                  <span className="text-muted-foreground">Applied:</span>
                  {query.trim() ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-foreground transition-colors hover:border-foreground"
                    >
                      Query: {query.trim()} ×
                    </button>
                  ) : null}
                  {selectedCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() =>
                        setSelectedCategories((prev) => prev.filter((item) => item !== category))
                      }
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-foreground transition-colors hover:border-foreground"
                    >
                      {category} ×
                    </button>
                  ))}
                  {hasPriceFilter ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPriceMin(priceBounds.min);
                        setPriceMax(priceBounds.max);
                      }}
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-foreground transition-colors hover:border-foreground"
                    >
                      ${priceMin}-${priceMax} ×
                    </button>
                  ) : null}
                  {inStockOnly ? (
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-foreground transition-colors hover:border-foreground"
                    >
                      In stock ×
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setSelectedCategories([]);
                      setPriceMin(priceBounds.min);
                      setPriceMax(priceBounds.max);
                      setInStockOnly(false);
                    }}
                    className="ml-1 border-b border-transparent text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}

              {results.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border bg-card p-10 text-center">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    No results
                  </p>
                  <h3 className="mt-3 font-heading text-2xl font-bold uppercase">
                    Nothing matched
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try clearing filters or search a different drop keyword.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Search;

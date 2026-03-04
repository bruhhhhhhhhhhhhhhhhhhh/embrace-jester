import { useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { useCatalog } from "@/components/catalog/catalog";
import { isNewProduct, toTimestamp } from "@/lib/productFreshness";

const NewReleasesSection = () => {
  const { products } = useCatalog();

  const newReleases = useMemo(() => {
    const byNewest = [...products].sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt));
    const recent = byNewest.filter((item) => isNewProduct(item.createdAt));
    if (recent.length) return recent.slice(0, 3);
    return byNewest.sort((a, b) => b.viewers - a.viewers).slice(0, 3);
  }, [products]);

  if (!newReleases.length) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 rounded-xl border border-border/70 bg-card px-5 py-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 h-12 w-[3px] rounded-full bg-forum-gold" />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                New Releases
              </p>
              <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                Latest Drops
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Most recent additions to the storefront. Start here before they move into the main
                collection rotation.
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {newReleases.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewReleasesSection;

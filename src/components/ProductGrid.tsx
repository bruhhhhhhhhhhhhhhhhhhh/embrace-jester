import { useCatalog } from "@/components/catalog/catalog";
import ProductCard from "./ProductCard";
import CatalogStatus from "./catalog/CatalogStatus";
import { Link } from "react-router-dom";

const QUICK_COLLECTIONS = [
  { label: "Tees", href: "/shop/tees" },
  { label: "Bottoms", href: "/shop/bottoms" },
  { label: "Hoodies", href: "/shop/hoodies" },
  { label: "Accessories", href: "/shop/accessories" },
];

const ProductGrid = () => {
  const { products, loading } = useCatalog();
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="border border-border bg-card px-5 py-5 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-12 w-[3px] bg-foreground" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                  Shop
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-[0.06em] text-foreground">
                  All Products
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the full catalog and move into product pages for variants, sizing, and live Stripe checkout.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_COLLECTIONS.map((collection) => (
                    <Link
                      key={collection.href}
                      to={collection.href}
                      className="border border-border bg-background px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      {collection.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border border-border bg-card px-5 py-5 shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Inventory
            </p>
            <p className="mt-2 font-heading text-2xl font-bold uppercase tracking-[0.06em] text-foreground">
              {products.length} Products
            </p>
            <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {totalStock} total units {loading ? "· syncing" : "· ready"}
            </p>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <p>Secure checkout with Stripe.</p>
              <p>Shipping thresholds visible before payment.</p>
            </div>
          </div>
        </div>
        <CatalogStatus className="mb-8" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

import { useCatalog } from "@/components/catalog/catalog";
import ProductCard from "./ProductCard";
import CatalogStatus from "./catalog/CatalogStatus";
import { Link } from "react-router-dom";

const QUICK_COLLECTIONS = [
  { label: "New", href: "/shop/new" },
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
          <div className="rounded-xl border border-border/70 bg-card px-5 py-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 h-12 w-[3px] rounded-full bg-foreground/80" />
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-muted-foreground">
                  Shop Thread
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                  All Items
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Browse the full collection and jump into any product page for variants, sizing, and
                  live checkout.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_COLLECTIONS.map((collection) => (
                    <Link
                      key={collection.href}
                      to={collection.href}
                      className="rounded-full border border-border/70 bg-background/30 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground"
                    >
                      {collection.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border/70 bg-card px-5 py-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Inventory
            </p>
            <p className="mt-2 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
              {products.length} Products
            </p>
            <p className="mt-1 text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">
              {totalStock} total units {loading ? "· syncing now" : "· ready"}
            </p>
            <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
              <p>Secure checkout with Stripe.</p>
              <p>Free shipping threshold shown before checkout.</p>
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

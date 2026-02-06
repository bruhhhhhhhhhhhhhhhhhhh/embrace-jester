import { products } from "@/data/products";
import ProductCard from "./ProductCard";

const ProductGrid = () => {
  return (
    <section className="border-b py-16">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex items-center gap-4">
          <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
            WAREHOUSE — ALL ITEMS
          </h2>
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground">
            {products.length} THREADS
          </span>
        </div>
        <div className="grid grid-cols-1 gap-px border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;

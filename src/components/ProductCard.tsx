import { Lock } from "lucide-react";
import type { Product } from "@/data/products";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const isLowStock = product.stock < 5;

  return (
    <div className="group border bg-card transition-colors">
      {/* Image */}
      <div className="relative border-b">
        <AspectRatio ratio={1}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        </AspectRatio>

        {/* Scarcity badge */}
        {isLowStock && (
          <div className="absolute left-0 top-3 flex items-center gap-1.5 border-y border-r bg-forum-red/90 px-3 py-1">
            <Lock className="h-3 w-3 text-foreground" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-foreground">
              LOCKED SOON
            </span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 transition-opacity group-hover:opacity-100">
          <button className="border border-foreground bg-background px-6 py-3 font-mono text-xs font-bold tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-background">
            [ ADD TO CART ]
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="mb-1 font-heading text-sm font-bold uppercase tracking-wide text-foreground">
          {product.name}
        </h3>
        <p className="mb-2 text-xs text-muted-foreground">
          🟢 {product.viewers} Users Viewing
        </p>
        <p className="font-mono text-lg font-bold text-forum-gold">
          ${product.price}
        </p>
      </div>
    </div>
  );
};

export default ProductCard;

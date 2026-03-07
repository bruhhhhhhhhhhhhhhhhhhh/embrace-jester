import { Search, User, ShoppingCart, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCartState } from "@/components/cart/cart";
import { useAuth } from "@/components/auth/auth";

const COLLECTION_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Tees", href: "/shop/tees" },
  { label: "Bottoms", href: "/shop/bottoms" },
  { label: "Hoodies", href: "/shop/hoodies" },
  { label: "Outerwear", href: "/shop/outerwear" },
  { label: "Accessories", href: "/shop/accessories" },
];

const PRIMARY_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Tees", href: "/shop/tees" },
  { label: "Bottoms", href: "/shop/bottoms" },
  { label: "FAQ", href: "/faq" },
  { label: "About", href: "/about" },
];

const Header = () => {
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const { count } = useCartState();
  const { user } = useAuth();

  return (
    <header className="sticky top-10 z-40 border-b border-border bg-background">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="group inline-flex items-center gap-3 focus-visible:outline-none">
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden border border-foreground bg-background text-foreground transition-colors duration-150 group-hover:bg-foreground group-hover:text-background">
            <span className="font-heading text-[11px] font-black uppercase tracking-[0.28em]">EJ</span>
            <span className="pointer-events-none absolute inset-[4px] border border-border transition-colors duration-150 group-hover:border-background" />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-heading text-[13px] font-extrabold uppercase tracking-[0.22em] text-foreground">
              EMBRACE JESTER
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Uniforms In Black
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <div className="relative hidden xl:block">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              onBlur={() => setTimeout(() => setCollectionsOpen(false), 150)}
              className="flex items-center gap-1.5 border-r border-border pr-5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:text-foreground"
            >
              Shop
              <ChevronDown
                className={`h-4 w-4 transition-transform ${collectionsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {collectionsOpen && (
              <div className="absolute left-0 top-full z-50 mt-3 w-56 border border-border bg-card p-2 shadow-elev-1">
                {COLLECTION_LINKS.map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.href}
                    className="block border border-transparent px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition-colors duration-150 hover:border-foreground hover:bg-background focus-visible:border-foreground"
                    onClick={() => setCollectionsOpen(false)}
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {PRIMARY_LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `border-b pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors duration-150 ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground focus-visible:border-border focus-visible:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="flex h-9 w-9 items-center justify-center border border-border bg-background text-muted-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background"
            aria-label="Search"
          >
            <Search className="h-4.5 w-4.5" />
          </Link>
          <Link
            to="/login"
            className="relative flex h-9 w-9 items-center justify-center border border-border bg-background text-muted-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background"
            aria-label="Account"
          >
            <User className="h-4.5 w-4.5" />
            {user ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 border border-background bg-foreground" />
            ) : null}
          </Link>
          <Link
            to="/cart"
            className="relative flex h-9 min-w-[52px] items-center justify-center gap-2 border border-border bg-background px-2 text-muted-foreground transition-colors duration-150 hover:border-foreground hover:bg-foreground hover:text-background focus-visible:border-foreground focus-visible:bg-foreground focus-visible:text-background"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]">Cart</span>
            <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center border border-foreground bg-foreground px-1 text-[9px] font-bold text-background">
              {count}
            </span>
          </Link>
        </div>
      </div>

      <div className="border-t border-border lg:hidden">
        <div className="container mx-auto flex items-center gap-4 overflow-x-auto px-4 py-2">
          {PRIMARY_LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `whitespace-nowrap border-b pb-1 font-mono text-[10px] uppercase tracking-[0.24em] ${
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground focus-visible:border-border focus-visible:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;

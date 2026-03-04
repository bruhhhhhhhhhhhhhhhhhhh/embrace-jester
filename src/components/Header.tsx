import { Search, User, ShoppingCart, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useCartState } from "@/components/cart/cart";
import { useAuth } from "@/components/auth/auth";

const COLLECTION_LINKS = [
  { label: "All Items", href: "/shop" },
  { label: "New Releases", href: "/shop/new" },
  { label: "Tees", href: "/shop/tees" },
  { label: "Bottoms", href: "/shop/bottoms" },
  { label: "Hoodies", href: "/shop/hoodies" },
  { label: "Outerwear", href: "/shop/outerwear" },
  { label: "Accessories", href: "/shop/accessories" },
];

const PRIMARY_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "New Releases", href: "/shop/new" },
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
    <header className="sticky top-[41px] z-40 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
        <Link
          to="/"
          className="group inline-flex items-center gap-3"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-foreground/35 bg-gradient-to-br from-foreground to-foreground/80 text-background shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            <span className="font-heading text-[11px] font-black uppercase tracking-[0.08em]">
              LX
            </span>
            <span className="pointer-events-none absolute inset-[3px] rounded-[5px] border border-background/20" />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="block font-heading text-[14px] font-extrabold uppercase tracking-[0.14em] text-foreground transition-colors group-hover:text-primary">
              LOOKSMAX
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
              SUPPLY CO.
            </span>
          </span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-6 lg:flex">
          <div className="relative hidden xl:block">
            <button
              onClick={() => setCollectionsOpen(!collectionsOpen)}
              onBlur={() => setTimeout(() => setCollectionsOpen(false), 150)}
              className="flex items-center gap-1.5 border-r border-border/70 pr-5 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Collections
              <ChevronDown
                className={`h-4 w-4 transition-transform ${collectionsOpen ? "rotate-180" : ""}`}
              />
            </button>

            {collectionsOpen && (
              <div className="absolute left-0 top-full z-50 mt-3 w-52 rounded-lg border bg-card p-2 shadow-xl">
                {COLLECTION_LINKS.map((cat) => (
                  <Link
                    key={cat.label}
                    to={cat.href}
                    className="block rounded-md px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
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
                `pb-1 font-heading text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                  isActive
                    ? "border-b border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-5">
          <Link to="/search" className="text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-5 w-5" />
          </Link>
          <Link to="/login" className="relative text-muted-foreground transition-colors hover:text-foreground">
            <User className="h-5 w-5" />
            {user ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border border-background bg-forum-green" />
            ) : null}
          </Link>
          <Link to="/cart" className="relative text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {count}
            </span>
          </Link>
        </div>
      </div>

      <div className="border-t border-border/70 lg:hidden">
        <div className="container mx-auto flex items-center gap-4 overflow-x-auto px-4 py-2">
          {PRIMARY_LINKS.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `whitespace-nowrap pb-1 font-mono text-[10px] uppercase tracking-[0.2em] ${
                  isActive
                    ? "border-b border-foreground text-foreground"
                    : "text-muted-foreground hover:text-foreground"
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

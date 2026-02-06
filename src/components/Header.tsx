import { Search, User, ShoppingCart, ChevronDown } from "lucide-react";
import { useState } from "react";

const categories = [
  { label: "New Drops", href: "#" },
  { label: "Hoodies", href: "#" },
  { label: "Tees", href: "#" },
  { label: "Bottoms", href: "#" },
  { label: "Outerwear", href: "#" },
  { label: "Accessories", href: "#" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-[41px] z-40 border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo — bigger */}
        <a href="/" className="font-mono text-xl font-bold tracking-tight text-foreground md:text-2xl">
          LOOKSMAX.STORE
        </a>

        {/* Center nav — category dropdown */}
        <nav className="hidden items-center gap-8 md:flex">
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
              className="flex items-center gap-1.5 font-heading text-sm font-semibold uppercase tracking-wider text-foreground transition-colors hover:text-primary"
            >
              Shop
              <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute left-1/2 top-full z-50 mt-3 w-48 -translate-x-1/2 rounded-lg border bg-card p-2 shadow-xl">
                {categories.map((cat) => (
                  <a
                    key={cat.label}
                    href={cat.href}
                    className="block rounded-md px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                  >
                    {cat.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {["Collections", "About"].map((item) => (
            <a
              key={item}
              href="#"
              className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* Right icons */}
        <div className="flex items-center gap-5">
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <User className="h-5 w-5" />
          </button>
          <button className="relative text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

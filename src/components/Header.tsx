import { Search, User, ShoppingCart } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-[41px] z-40 border-b bg-background">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="font-mono text-lg font-bold tracking-tight text-foreground">
          [ LOOKSMAX.STORE ]
        </div>
        <div className="flex items-center gap-5">
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <Search className="h-5 w-5" />
          </button>
          <button className="text-muted-foreground transition-colors hover:text-foreground">
            <User className="h-5 w-5" />
          </button>
          <button className="relative text-muted-foreground transition-colors hover:text-foreground">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center border bg-card text-[10px] font-bold text-foreground">
              0
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

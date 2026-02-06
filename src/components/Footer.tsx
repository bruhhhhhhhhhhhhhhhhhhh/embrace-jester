const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 font-mono text-sm font-bold text-foreground">
              [ LOOKSMAX.STORE ]
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Optimized streetwear for those who refuse to settle. Every piece
              engineered for maximum aesthetic impact.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              SHOP
            </h4>
            <ul className="space-y-2">
              {["New Drops", "Hoodies", "Tees", "Bottoms", "Accessories"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              INFO
            </h4>
            <ul className="space-y-2">
              {["Size Guide", "Shipping", "Returns", "FAQ", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="mb-4 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              CONNECT
            </h4>
            <ul className="space-y-2">
              {["Twitter / X", "Instagram", "Discord", "TikTok"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t pt-6 text-center">
          <p className="font-mono text-[10px] text-muted-foreground">
            © 2026 LOOKSMAX.STORE — ALL RIGHTS RESERVED. MOG OR BE MOGGED.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

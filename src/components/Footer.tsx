const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="mb-4 font-mono text-lg font-bold text-foreground">
              LOOKSMAX.STORE
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Optimized streetwear for those who refuse to settle. Every piece
              engineered for maximum aesthetic impact.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Shop
            </h4>
            <ul className="space-y-2">
              {["New Drops", "Hoodies", "Tees", "Bottoms", "Accessories"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Info
            </h4>
            <ul className="space-y-2">
              {["Size Guide", "Shipping", "Returns", "FAQ", "Contact"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Connect
            </h4>
            <ul className="space-y-2">
              {["Twitter / X", "Instagram", "Discord", "TikTok"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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
          <p className="text-xs text-muted-foreground">
            © 2026 LOOKSMAX.STORE — All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { persistConsent, readStoredConsent, type ConsentStatus } from "@/lib/consent";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const consent = readStoredConsent();
    setIsVisible(!consent);
    setIsLoaded(true);
  }, []);

  const handleConsent = (status: ConsentStatus) => {
    persistConsent(status);
    setIsVisible(false);
  };

  if (!isLoaded || !isVisible) return null;

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border/80 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
          We use essential technologies for cart, checkout, and account state. Optional technologies
          help with analytics and campaign performance. See our{" "}
          <Link className="text-foreground underline" to="/cookies">
            Cookie Policy
          </Link>{" "}
          and{" "}
          <Link className="text-foreground underline" to="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleConsent("essential_only")}
            className="rounded-md border border-border/70 px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground/60 hover:text-foreground"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleConsent("accepted")}
            className="rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CookieBanner;

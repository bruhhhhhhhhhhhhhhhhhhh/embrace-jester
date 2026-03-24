import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CONSENT_EVENT_NAME,
  persistConsent,
  readStoredConsent,
  type ConsentStatus,
} from "@/lib/consent";
import { legal } from "@/config/legal";

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const syncVisibility = () => {
      const consent = readStoredConsent();
      setIsVisible(!consent);
      setIsLoaded(true);
    };

    syncVisibility();
    window.addEventListener(CONSENT_EVENT_NAME, syncVisibility);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, syncVisibility);
    };
  }, []);

  const handleConsent = (status: ConsentStatus) => {
    persistConsent(status);
    setIsVisible(false);
  };

  if (!isLoaded || !isVisible) return null;

  return (
    <aside className="fixed bottom-0 left-0 right-0 z-[70] border-t border-border bg-background/95">
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
          ,{" "}
          <Link className="text-foreground underline" to={legal.privacyChoicesPath}>
            Your Privacy Choices
          </Link>
          .
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleConsent("essential_only")}
            className="border border-border px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Essential Only
          </button>
          <button
            onClick={() => handleConsent("accepted")}
            className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-background transition-colors hover:bg-background hover:text-foreground"
          >
            Accept All
          </button>
        </div>
      </div>
    </aside>
  );
};

export default CookieBanner;

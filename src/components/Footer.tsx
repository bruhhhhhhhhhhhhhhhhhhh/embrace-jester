import { Link } from "react-router-dom";
import { type FormEvent, useState } from "react";
import { legal } from "@/config/legal";
import { apiFetch } from "@/lib/api";

const SHOP_LINKS = [
  { label: "All Products", href: "/shop" },
  { label: "Hoodies", href: "/shop/hoodies" },
  { label: "Tees", href: "/shop/tees" },
  { label: "Bottoms", href: "/shop/bottoms" },
  { label: "Accessories", href: "/shop/accessories" },
];

const INFO_LINKS = [
  { label: "Size Guide", to: "/size-guide" },
  { label: "Shipping", to: "/shipping" },
  { label: "Returns", to: "/returns" },
  { label: "FAQ", to: "/faq" },
  { label: "Accessibility", to: legal.accessibilityPath },
  { label: "Contact", to: "/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Your Privacy Choices", to: legal.privacyChoicesPath },
  { label: "Accessibility", to: legal.accessibilityPath },
  { label: "Review Policy", to: legal.reviewPolicyPath },
  { label: "Terms", to: "/terms" },
];

const SOCIAL_LINKS = [
  {
    label: "Twitter / X",
    platform: "x",
    href: import.meta.env.VITE_SOCIAL_X_URL || "https://x.com/embracejester",
  },
  {
    label: "Instagram",
    platform: "instagram",
    href: import.meta.env.VITE_SOCIAL_INSTAGRAM_URL || "https://instagram.com/embracejester",
  },
  {
    label: "TikTok",
    platform: "tiktok",
    href: import.meta.env.VITE_SOCIAL_TIKTOK_URL || "https://tiktok.com/@embracejester",
  },
  {
    label: "Discord",
    platform: "discord",
    href: import.meta.env.VITE_SOCIAL_DISCORD_URL || "https://discord.gg/embracejester",
  },
].filter((entry) => Boolean(entry.href));

const withUtm = (url: string, platform: string) => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("utm_source", "site");
    parsed.searchParams.set("utm_medium", "footer");
    parsed.searchParams.set("utm_campaign", "social");
    parsed.searchParams.set("utm_content", platform);
    return parsed.toString();
  } catch {
    return url;
  }
};

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      setStatusMessage("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");
    try {
      const response = await apiFetch<{ ok: boolean; subscribers: number }>(
        "/api/newsletter/subscribe",
        {
          method: "POST",
          body: JSON.stringify({
            email: normalized,
            source: "footer",
          }),
        }
      );
      setStatusMessage(`Subscribed. ${response.subscribers} active subscribers.`);
      setEmail("");
    } catch (error) {
      setStatusMessage((error as Error).message || "Subscription failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-4 font-heading text-lg font-bold uppercase tracking-[0.08em] text-foreground">
              {legal.brandName}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sinister monochrome streetwear for men building undeniable aesthetic value. Built for
              harsh contrast and clean silhouettes.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Shop
            </h4>
            <ul className="space-y-2">
              {SHOP_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-sm uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Info
            </h4>
            <ul className="space-y-2">
              {INFO_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="text-sm uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Signals
            </h4>
            <form className="mb-5 space-y-2" onSubmit={handleNewsletterSubmit}>
              <label
                htmlFor="footer-newsletter-email"
                className="block text-[10px] font-mono uppercase tracking-[0.24em] text-muted-foreground"
              >
                Drop Alerts
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="footer-newsletter-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-60"
                >
                  {isSubmitting ? "..." : "Join"}
                </button>
              </div>
              {statusMessage ? (
                <p className="text-[11px] text-muted-foreground">{statusMessage}</p>
              ) : null}
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                By subscribing, you agree to receive store emails. Unsubscribe anytime. See our{" "}
                <Link className="text-foreground underline" to="/privacy">
                  Privacy Policy
                </Link>
                .
              </p>
            </form>
            <ul className="space-y-2">
              {SOCIAL_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={withUtm(item.href, item.platform)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <div className="mb-3 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
            {LEGAL_LINKS.map((item) => (
              <Link key={item.label} className="hover:text-foreground" to={item.to}>
                {item.label}
              </Link>
            ))}
            <Link className="hover:text-foreground" to="/cookies">
              Cookies
            </Link>
          </div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            © 2026 Embrace Jester — All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

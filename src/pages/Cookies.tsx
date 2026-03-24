import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";
import { clearStoredConsent } from "@/lib/consent";

const Cookies = () => {
  const resetConsent = () => {
    if (typeof window === "undefined") return;
    clearStoredConsent();
    window.location.reload();
  };

  return (
    <StaticPageLayout
      eyebrow="Legal"
      title="Cookie Policy"
      description="This policy explains which cookies and similar technologies are used, why they are used, and how to control them."
    >
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedCookies}
        </p>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            1. What We Use
          </h2>
          <p className="mt-2">
            We use cookies and similar technologies, including local storage and session storage, to
            operate the site, maintain your cart and checkout state, remember consent choices, and
            measure performance when optional tracking is allowed.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            2. Categories of Technologies
          </h2>
          <div className="mt-3 overflow-x-auto border border-border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-secondary/60">
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Examples On This Site</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Essential</td>
                  <td className="px-3 py-2">
                    Site operation, cart state, checkout continuity, consent memory, and security.
                  </td>
                  <td className="px-3 py-2">
                    Consent preference, cart state, latest order reference, storefront session, and
                    catalog cache.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Optional Analytics</td>
                  <td className="px-3 py-2">Traffic measurement, funnel analysis, and campaign reporting.</td>
                  <td className="px-3 py-2">
                    Analytics technologies from providers such as Google when configured and enabled.
                  </td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Optional Advertising</td>
                  <td className="px-3 py-2">Ad attribution, remarketing, and campaign performance reporting.</td>
                  <td className="px-3 py-2">
                    Advertising pixels from providers such as Meta or TikTok when configured and enabled.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            3. Consent Choices
          </h2>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>You can choose Essential Only or allow optional tracking when prompted.</li>
            <li>Optional technologies are not required for cart, checkout, or order support.</li>
            <li>You can revisit choices at any time in <Link className="text-foreground underline" to={legal.privacyChoicesPath}>Your Privacy Choices</Link>.</li>
          </ul>
          <div className="mt-3">
            <button
              type="button"
              onClick={resetConsent}
              className="border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
              Reset Cookie Preference
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            4. Related Policies
          </h2>
          <p className="mt-2">
            See our <Link className="text-foreground underline" to="/privacy">Privacy Policy</Link>,{" "}
            <Link className="text-foreground underline" to={legal.privacyChoicesPath}>Your Privacy Choices</Link>, and{" "}
            <Link className="text-foreground underline" to="/terms">Terms of Service</Link> for related details.
          </p>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default Cookies;

import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

const EFFECTIVE_DATE = "March 1, 2026";

const Cookies = () => {
  const resetConsent = () => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      window.location.reload();
    } catch {
      // ignore storage failures
    }
  };

  return (
    <StaticPageLayout
      eyebrow="Legal"
      title="Cookie Policy"
      description="This policy explains which cookies and similar technologies we use, why we use them, and how to control them."
    >
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}
        </p>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            1. What We Use
          </h2>
          <p className="mt-2">
            We use cookies and similar technologies (including local storage and session storage) to
            operate the site, remember preferences, support checkout, and measure performance.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            2. Categories of Technologies
          </h2>
          <div className="mt-3 overflow-x-auto rounded-lg border">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-secondary/60">
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Purpose</th>
                  <th className="px-3 py-2">Examples On This Site</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Essential</td>
                  <td className="px-3 py-2">
                    Site operation, checkout/session continuity, cart state, and security controls.
                  </td>
                  <td className="px-3 py-2">
                    <code>looksmax.cookie-consent.v1</code>, <code>looksmax.cart.v1</code>,{" "}
                    <code>looksmax.order.latest</code>, <code>looksmax.auth.v1</code>,{" "}
                    <code>looksmax.catalog.v1</code>, <code>looksmax.search.recent</code>,{" "}
                    <code>looksmax.conversion.session_id</code>.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Optional Analytics</td>
                  <td className="px-3 py-2">
                    Understand traffic, funnel behavior, and campaign effectiveness.
                  </td>
                  <td className="px-3 py-2">
                    Analytics/pixel technologies (for example Google, Meta, TikTok) only when
                    configured and consent is accepted.
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-3 py-2 font-mono uppercase text-muted-foreground">Advertising</td>
                  <td className="px-3 py-2">
                    Measure and optimize ad performance and remarketing where legally permitted.
                  </td>
                  <td className="px-3 py-2">
                    Pixel and ad attribution identifiers created by third-party ad platforms after
                    opt-in.
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
          <ul className="mt-2 space-y-2 list-disc pl-5">
            <li>When first visiting the site, you can choose "Essential Only" or "Accept All."</li>
            <li>If you choose Essential Only, optional analytics/advertising technologies are not enabled.</li>
            <li>You can also control cookies through your browser settings.</li>
          </ul>
          <div className="mt-3">
            <button
              type="button"
              onClick={resetConsent}
              className="rounded-md border border-foreground bg-foreground px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-background transition-colors hover:bg-transparent hover:text-foreground"
            >
              Reset Cookie Preference
            </button>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            4. Third-Party Technologies
          </h2>
          <p className="mt-2">
            Some analytics or advertising tools set their own cookies/identifiers under their own
            privacy policies. We recommend reviewing those third-party notices before consenting.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            5. Related Policies
          </h2>
          <p className="mt-2">
            See our <Link className="text-foreground underline" to="/privacy">Privacy Policy</Link>{" "}
            and <Link className="text-foreground underline" to="/terms">Terms of Service</Link> for
            additional details.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            6. Changes to This Policy
          </h2>
          <p className="mt-2">
            We may update this Cookie Policy from time to time. Changes are effective when posted
            with a revised effective date.
          </p>
        </section>
      </div>
    </StaticPageLayout>
  );
};

export default Cookies;

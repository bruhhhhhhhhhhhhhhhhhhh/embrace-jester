import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { formatLegalResponseWindow, legal } from "@/config/legal";
import {
  CONSENT_EVENT_NAME,
  clearStoredConsent,
  getConsentStatus,
  isGlobalPrivacyControlEnabled,
  persistConsent,
  type ConsentStatus,
} from "@/lib/consent";

const statusCopy: Record<ConsentStatus, string> = {
  accepted: "Optional analytics and advertising tracking is currently enabled in this browser.",
  essential_only: "Only essential site functionality is active in this browser.",
};

const PrivacyChoices = () => {
  const [consentStatus, setConsentStatus] = useState<ConsentStatus | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const gpcEnabled = useMemo(() => isGlobalPrivacyControlEnabled(), []);

  useEffect(() => {
    const syncConsent = () => {
      setConsentStatus(getConsentStatus());
    };

    syncConsent();
    window.addEventListener(CONSENT_EVENT_NAME, syncConsent);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, syncConsent);
    };
  }, []);

  const handleConsentChange = (status: ConsentStatus) => {
    persistConsent(status);
    setConsentStatus(status);
    setStatusMessage(
      status === "accepted"
        ? "Optional analytics and advertising tracking is enabled for this browser."
        : "Optional analytics and advertising tracking is disabled for this browser."
    );
  };

  const handleReset = () => {
    clearStoredConsent();
    setConsentStatus(getConsentStatus());
    setStatusMessage(
      "Saved choices were cleared. Optional tracking remains off until you choose otherwise."
    );
  };

  return (
    <StaticPageLayout
      eyebrow="Legal"
      title="Your Privacy Choices"
      description="Manage optional analytics and advertising choices for this browser without affecting essential store functionality."
    >
      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          This page controls optional analytics and advertising technologies used to measure traffic,
          campaign performance, and storefront conversion. Cart, checkout, account, and security
          features continue to work without optional tracking.
        </p>
        <p>
          If your browser sends a Global Privacy Control signal and no saved choice is present,
          optional tracking defaults to off in this browser.
        </p>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            1. Essential Site Functionality
          </h2>
          <p className="mt-2">
            Essential technologies keep your cart active, maintain checkout progress, remember
            consent choices, and support core account and security features. These functions remain
            available even if optional tracking is disabled.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            2. Optional Analytics and Advertising
          </h2>
          <p className="mt-2">
            Optional technologies may include analytics tools and advertising pixels for providers
            such as Google, Meta, and TikTok when configured. They are used to understand traffic,
            measure campaigns, and improve storefront performance.
          </p>
          <div className="mt-4 border border-border bg-background/40 p-4">
            <p className="text-[11px] font-mono uppercase tracking-[0.24em] text-muted-foreground">
              Current Setting
            </p>
            <p className="mt-2 text-sm text-foreground">
              {consentStatus ? statusCopy[consentStatus] : "No saved optional-tracking choice yet."}
            </p>
            {gpcEnabled ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Browser opt-out signal detected. Optional tracking stays off unless you later allow
                it in this browser.
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleConsentChange("essential_only")}
                className="border border-foreground bg-background px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={() => handleConsentChange("accepted")}
                className="border border-foreground bg-background px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
              >
                Allow Optional Tracking
              </button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            3. Reset Consent
          </h2>
          <p className="mt-2">
            Resetting removes saved consent choices for this browser so you can decide again later.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 border border-border px-4 py-3 text-[10px] font-mono font-bold uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-0"
          >
            Reset Saved Choice
          </button>
        </section>

        <section>
          <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
            4. Contact for Privacy Requests
          </h2>
          <p className="mt-2">
            Designated privacy contact:{" "}
            {legal.supportInboxOperational ? (
              <a className="text-foreground underline" href={`mailto:${legal.privacyEmail}`}>
                {legal.privacyEmail}
              </a>
            ) : (
              <span className="text-foreground">{legal.privacyEmail}</span>
            )}
            . You can also review the full <Link className="text-foreground underline" to="/privacy">Privacy Policy</Link> or use the{" "}
            <Link className="text-foreground underline" to="/contact">Contact page</Link>.
          </p>
          <p className="mt-2">
            Current privacy-request response window:{" "}
            {formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.
          </p>
          {!legal.supportInboxOperational ? (
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Mailbox activation is in progress. Confirm inbox delivery before launch.
            </p>
          ) : null}
        </section>

        {statusMessage ? <p className="text-sm text-foreground">{statusMessage}</p> : null}
      </div>
    </StaticPageLayout>
  );
};

export default PrivacyChoices;

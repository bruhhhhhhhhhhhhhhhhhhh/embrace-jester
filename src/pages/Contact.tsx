import StaticPageLayout from "@/components/StaticPageLayout";
import { formatLegalResponseWindow, getMailingAddressLines, isLegalPlaceholder, legal } from "@/config/legal";

const hasPublishedMailingAddress =
  !isLegalPlaceholder(legal.mailingAddressLine1) &&
  !isLegalPlaceholder(legal.city) &&
  !isLegalPlaceholder(legal.region) &&
  !isLegalPlaceholder(legal.postalCode) &&
  !isLegalPlaceholder(legal.country);

const Contact = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Contact"
    description="Use these channels for order support, fit questions, privacy requests, partnership requests, or wholesale inquiries."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Customer Support
        </h2>
        <p className="mt-2">
          Email{" "}
          <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          {" "}for order issues, delivery questions, or product support.
        </p>
        <p className="mt-2">
          Current response window: {formatLegalResponseWindow(legal.supportResponseWindowBusinessDays)}.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Privacy Requests
        </h2>
        <p className="mt-2">
          Privacy requests can be sent to{" "}
          <a className="text-foreground underline" href={`mailto:${legal.privacyEmail}`}>
            {legal.privacyEmail}
          </a>
          .
        </p>
        <p className="mt-2">
          Current privacy-request response window:{" "}
          {formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.
        </p>
      </section>

      {hasPublishedMailingAddress ? (
        <section>
          <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
            Mailing Address
          </h2>
          <div className="mt-2 space-y-1">
            {getMailingAddressLines().map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        </section>
      ) : null}

      <p className="border border-border/60 bg-background/40 p-3 text-xs uppercase tracking-widest">
        Please include order ID and supporting photos for damaged-item claims.
      </p>
    </div>
  </StaticPageLayout>
);

export default Contact;

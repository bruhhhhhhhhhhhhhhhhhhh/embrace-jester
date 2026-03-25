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
          Designated support email:{" "}
          {legal.supportInboxOperational ? (
            <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
              {legal.supportEmail}
            </a>
          ) : (
            <span className="text-foreground">{legal.supportEmail}</span>
          )}
          .
        </p>
        <p className="mt-2">
          Current response window: {formatLegalResponseWindow(legal.supportResponseWindowBusinessDays)}.
        </p>
        {!legal.supportInboxOperational ? (
          <p className="mt-2 border border-border/60 bg-background/40 p-3 text-xs uppercase tracking-[0.16em]">
            Mailbox activation is in progress. Confirm inbox delivery before public launch.
          </p>
        ) : null}
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Privacy Requests
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

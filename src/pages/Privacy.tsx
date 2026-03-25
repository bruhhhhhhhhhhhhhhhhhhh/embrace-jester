import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import {
  formatLegalResponseWindow,
  getMailingAddressLines,
  isLegalPlaceholder,
  legal,
} from "@/config/legal";

const hasPublishedMailingAddress =
  !isLegalPlaceholder(legal.mailingAddressLine1) &&
  !isLegalPlaceholder(legal.city) &&
  !isLegalPlaceholder(legal.region) &&
  !isLegalPlaceholder(legal.postalCode) &&
  !isLegalPlaceholder(legal.country);

const Privacy = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Privacy Policy"
    description="This policy explains what information we collect, how we use it, when we share it, and what choices you have."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedPrivacy}
      </p>
      <p>
        This Privacy Policy applies to personal information collected through {legal.brandName},
        including when you browse the storefront, place an order, subscribe to email updates,
        request support, or submit a review.
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          1. Categories of Information We Collect
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Identifiers and contact details, such as name, email address, phone number, and shipping address.</li>
          <li>Order details, including products, variants, quantities, shipping method, and transaction status.</li>
          <li>Payment metadata from our payment processor, such as payment intent or session references.</li>
          <li>Support and review information, including messages, ratings, review content, and any media you submit.</li>
          <li>Device, browser, referral, and usage information collected through essential site technologies and optional analytics tools.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          2. Sources of Information
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Directly from you through checkout, account, newsletter, support, and review forms.</li>
          <li>Automatically through cookies, local storage, and optional analytics or advertising tools when enabled.</li>
          <li>From service providers involved in payment processing, fulfillment, fraud prevention, and order delivery.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          3. How We Use Information
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Process payments, produce and deliver orders, and send service updates.</li>
          <li>Respond to support requests, review order issues, and prevent fraud or abuse.</li>
          <li>Operate and improve the storefront, catalog, checkout flow, and review systems.</li>
          <li>Send marketing emails if you subscribe, and honor unsubscribe requests.</li>
          <li>Measure traffic and campaign performance when optional tracking is allowed.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          4. How We Share Information
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Payment processors, shipping carriers, and service providers that help us process and deliver orders.</li>
          <li>Print-on-demand fulfillment providers that produce and ship made-to-order items through our fulfillment workflow.</li>
          <li>Infrastructure, analytics, email, support, and fraud-prevention vendors acting on our instructions.</li>
          <li>Authorities or legal counterparties when required by law or necessary to protect rights and safety.</li>
        </ul>
        <p className="mt-2">
          We do not sell personal information for money. If optional advertising technologies are
          enabled, certain disclosures may be treated as "sharing" for cross-context behavioral
          advertising under some U.S. privacy laws.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          5. Optional Analytics and Advertising
        </h2>
        <p className="mt-2">
          When enabled, optional technologies may include Google Analytics, Meta Pixel, and TikTok
          Pixel when those tools are configured for this storefront. They are used to understand
          traffic, campaign performance, and conversion.
        </p>
        <p className="mt-2">
          You can manage those choices at any time in <Link className="text-foreground underline" to={legal.privacyChoicesPath}>Your Privacy Choices</Link>.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          6. International Transfers
        </h2>
        <p className="mt-2">
          Some service providers, payment processors, carriers, and fulfillment partners may process
          information outside Canada. This can include providers involved in payment processing,
          analytics, customer communications, and made-to-order fulfillment.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          7. Retention
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Order and transaction records are retained as needed for operations, accounting, and disputes.</li>
          <li>Support and review records are retained for quality control, moderation, and legal compliance.</li>
          <li>Marketing records are retained until you unsubscribe or request deletion, subject to legal exceptions.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          8. Your Rights and Choices
        </h2>
        <p className="mt-2">
          Depending on where you live, you may have rights to access, correct, delete, or export
          your personal information, and to opt out of certain advertising-related uses.
        </p>
        <p className="mt-2">
          Marketing emails can be stopped through the unsubscribe link in the email or by visiting{" "}
          <Link className="text-foreground underline" to={legal.unsubscribePath}>Unsubscribe</Link>.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          9. Security and Children
        </h2>
        <p className="mt-2">
          We use reasonable technical and organizational safeguards, but no storage or transmission
          method is fully secure. This site is not directed to children under 13.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          10. Contact
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
          . You can also review the <Link className="text-foreground underline" to="/contact">Contact page</Link>.
        </p>
        <p className="mt-2">
          Current privacy-request response window:{" "}
          {formatLegalResponseWindow(legal.privacyRequestResponseWindowBusinessDays)}.
        </p>
        {!legal.supportInboxOperational ? (
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Designated inbox status: mailbox activation is in progress. Confirm delivery before launch.
          </p>
        ) : null}
        {hasPublishedMailingAddress ? (
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            {getMailingAddressLines().map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  </StaticPageLayout>
);

export default Privacy;

import StaticPageLayout from "@/components/StaticPageLayout";
import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "March 1, 2026";
const SUPPORT_EMAIL = "support@looksmax.store";

const Privacy = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Privacy Policy"
    description="This policy explains what data we collect, how we use it, who we share it with, and your privacy choices."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}
      </p>
      <p>
        This Privacy Policy applies to personal information collected through LOOKSMAX.STORE,
        including when you browse, place an order, subscribe to marketing, or contact support.
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          1. Information We Collect
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Identifiers and contact details: name, email, shipping address, phone (if provided).</li>
          <li>Order data: products, sizes, colors, quantities, shipping method, and transaction status.</li>
          <li>Payment metadata: payment intent/session references and payment status from our processor.</li>
          <li>Support and review data: messages, photos, and review content you submit.</li>
          <li>Device and usage data: pages viewed, referral/UTM data, device/browser signals, and event telemetry.</li>
          <li>Cookie/local storage data as described in our <Link className="text-foreground underline" to="/cookies">Cookie Policy</Link>.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          2. How We Use Personal Information
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Process payments, produce and ship orders, and provide order updates.</li>
          <li>Respond to support requests, review claims, and prevent fraud/abuse.</li>
          <li>Operate and improve site features, catalog quality, and checkout performance.</li>
          <li>Send service emails (order confirmations, shipping notices, policy updates).</li>
          <li>Send marketing messages if you opt in, and honor unsubscribe/opt-out requests.</li>
          <li>Measure campaign and storefront performance where consent is required and provided.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          3. Fulfillment Partners (Including Printify)
        </h2>
        <p className="mt-2">
          We use third-party fulfillment infrastructure, including Printify and production partners in
          its network, to produce and ship made-to-order items. To fulfill your purchase, we share
          necessary order and shipping details with those partners and carriers.
        </p>
        <p className="mt-2">
          Printify documentation indicates recipient data visibility in its interface may be limited
          after a defined window (for example, certain recipient address fields may no longer be shown
          after approximately 30 days from delivery/cancellation), while operational order history may
          remain available in connected sales channels.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          4. Payment Processors
        </h2>
        <p className="mt-2">
          Card payments are processed by third-party providers (including Stripe). We do not store
          full payment card numbers or security codes on our servers.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          5. Analytics and Advertising
        </h2>
        <p className="mt-2">
          With your consent, we may use analytics/advertising technologies (for example Google
          Analytics, Meta Pixel, and TikTok Pixel when configured) to understand traffic,
          remarketing performance, and checkout conversion.
        </p>
        <p className="mt-2">
          Without optional consent, we limit tracking to essential functionality needed for site
          operation, cart state, checkout flow, and security.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          6. How We Share Information
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Fulfillment/production providers and shipping carriers.</li>
          <li>Payment processors and fraud prevention providers.</li>
          <li>Email, support, analytics, and infrastructure providers acting on our instructions.</li>
          <li>Authorities or legal counterparties when required by law or to protect rights and safety.</li>
        </ul>
        <p className="mt-2">
          We do not sell personal information for monetary payment. If you opt into advertising
          cookies/pixels, some disclosures may be considered "sharing" for cross-context behavioral
          advertising under certain U.S. privacy laws.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          7. Retention
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Order and transaction records are retained as needed for operations, tax/accounting, and dispute handling.</li>
          <li>Support and claim records are retained for quality control and legal compliance.</li>
          <li>Marketing records are retained until you unsubscribe or request deletion (subject to legal exceptions).</li>
          <li>Cookie/local storage retention varies by category and browser settings.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          8. Your Privacy Rights
        </h2>
        <p className="mt-2">
          Depending on your jurisdiction, you may have rights to access, correct, delete, or port
          your personal information, and to object to or limit certain processing.
        </p>
        <p className="mt-2">
          U.S. state residents may also have rights related to targeted advertising and sensitive data
          handling. California residents may designate an authorized agent and may request details on
          categories of data collected, used, and disclosed.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          9. Children
        </h2>
        <p className="mt-2">
          This site is not directed to children under 13, and we do not knowingly collect personal
          information from children under 13.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          10. Security
        </h2>
        <p className="mt-2">
          We use commercially reasonable technical and organizational safeguards to protect personal
          data. No transmission or storage system is guaranteed to be 100% secure.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          11. International Transfers
        </h2>
        <p className="mt-2">
          Your information may be processed in countries other than your country of residence,
          including by service providers and fulfillment partners. We use contractual and operational
          safeguards where required by law.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          12. Policy Updates
        </h2>
        <p className="mt-2">
          We may update this Privacy Policy periodically. When we do, we will post the revised
          version with a new effective date.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          13. Contact
        </h2>
        <p className="mt-2">
          To exercise privacy rights or ask questions, contact{" "}
          <a className="text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Privacy;

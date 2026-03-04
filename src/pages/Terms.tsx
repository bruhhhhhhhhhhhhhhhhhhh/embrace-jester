import StaticPageLayout from "@/components/StaticPageLayout";

const EFFECTIVE_DATE = "March 1, 2026";
const SUPPORT_EMAIL = "support@embracejester.com";

const Terms = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Terms Of Service"
    description="These Terms govern your use of this site and any purchase you make from EMBRACE JESTER."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Effective date:</strong> {EFFECTIVE_DATE}
      </p>
      <p>
        By using this website, creating an account, or placing an order, you agree to these Terms.
        If you do not agree, do not use this site.
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          1. Eligibility and Account Use
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>You must be at least 18 years old or use the site with parent/guardian consent.</li>
          <li>You are responsible for information submitted through your account or checkout.</li>
          <li>You must provide accurate contact, shipping, and payment information.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          2. Products, Pricing, and Order Acceptance
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Product images are illustrative; color and print placement may vary by device and production method.</li>
          <li>Prices, product availability, promotions, and shipping options can change at any time.</li>
          <li>We may cancel or refuse orders for suspected fraud, pricing/configuration error, policy violation, or stock/production constraints.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          3. Payments
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Payments are processed by third-party payment providers (including Stripe).</li>
          <li>You represent that you are authorized to use the submitted payment method.</li>
          <li>We do not store full card numbers or card security codes on our servers.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          4. Print-On-Demand Fulfillment and Printify
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Orders are made to order and fulfilled through third-party production partners, including the Printify provider network.</li>
          <li>Production quality and timing can vary by provider and carrier.</li>
          <li>To fulfill your order, we share required order details with fulfillment providers and shipping carriers.</li>
          <li>Products may ship in separate packages if produced at different facilities.</li>
          <li>Because items are custom-produced, order edits or cancellations may be unavailable once production has started.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          5. Shipping, Delivery, and Address Accuracy
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Shipping timelines shown at checkout are estimates and not guaranteed delivery dates.</li>
          <li>You are responsible for entering a complete and accurate shipping address.</li>
          <li>We are not liable for delays caused by carriers, weather, customs, or events outside our control.</li>
          <li>Where applicable, customs duties, import taxes, or brokerage fees are the customer's responsibility.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          6. Returns, Reprints, and Refunds
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>If an item is damaged, defective, misprinted, or incorrect, contact us promptly with your order number and clear photos.</li>
          <li>Issue reports should generally be submitted within 30 days of delivery (or estimated delivery for lost-package scenarios).</li>
          <li>Custom and made-to-order items are generally not returnable for buyer's remorse, sizing preference, or incorrect address entries.</li>
          <li>Approved resolutions may include replacement, store credit, or refund to the original payment method.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          7. Intellectual Property and User Content
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>All site content, branding, logos, and designs are owned by us or our licensors and protected by law.</li>
          <li>If you submit or upload content, you represent that you own it or have permission to use it.</li>
          <li>You may not upload or request production of infringing, counterfeit, unlawful, or prohibited content.</li>
          <li>We may remove content or cancel orders that appear to violate intellectual property rights or applicable law.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          8. Prohibited Conduct
        </h2>
        <ul className="mt-2 space-y-2 list-disc pl-5">
          <li>Do not misuse the site, reverse engineer it, or interfere with security or normal operations.</li>
          <li>Do not use the site for unlawful, deceptive, harassing, or fraudulent activity.</li>
          <li>Do not submit malware, automated scraping tools, or abusive traffic.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          9. Disclaimer of Warranties
        </h2>
        <p className="mt-2">
          To the fullest extent allowed by law, the site and services are provided "as is" and "as
          available" without warranties of any kind, express or implied.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          10. Limitation of Liability
        </h2>
        <p className="mt-2">
          To the fullest extent permitted by law, we will not be liable for indirect, incidental,
          special, consequential, or punitive damages. Our aggregate liability for any claim related
          to an order is limited to the amount you paid for that order.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          11. Indemnification
        </h2>
        <p className="mt-2">
          You agree to defend and indemnify us against claims, liabilities, losses, and expenses
          arising from your breach of these Terms, your misuse of the site, or your infringement of
          third-party rights.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          12. Governing Law and Disputes
        </h2>
        <p className="mt-2">
          These Terms are governed by the laws of the state or country of our principal place of
          business, without regard to conflict-of-law rules. You agree to the exclusive venue of
          competent courts in that jurisdiction unless applicable consumer law requires otherwise.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          13. Changes to These Terms
        </h2>
        <p className="mt-2">
          We may update these Terms from time to time. The updated version is effective when posted
          with a revised effective date.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          14. Contact
        </h2>
        <p className="mt-2">
          Questions about these Terms:{" "}
          <a className="text-foreground underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Terms;

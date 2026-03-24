import { Link } from "react-router-dom";
import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";

const Terms = () => (
  <StaticPageLayout
    eyebrow="Legal"
    title="Terms Of Service"
    description="These terms govern your use of the storefront and any order placed through it."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedTerms}
      </p>
      <p>
        <strong className="text-foreground">Store operator:</strong> {legal.legalEntityName}
      </p>
      <p>
        By using this site, creating an account, or placing an order, you agree to these Terms. If
        you do not agree, do not use the site.
      </p>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          1. Eligibility and Use
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>You must be at least 18 years old or use the site with parent or guardian consent.</li>
          <li>You are responsible for the accuracy of information submitted through checkout or account features.</li>
          <li>You may not misuse the site, interfere with operations, or use it for unlawful activity.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          2. Products, Pricing, and Order Acceptance
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Product images are illustrative. Color, print placement, and finish may vary.</li>
          <li>Prices, availability, and shipping options may change without notice.</li>
          <li>We may refuse or cancel orders for fraud risk, pricing error, configuration error, policy violation, or production constraints.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          3. Payments
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Payments are processed by third-party payment providers, including Stripe.</li>
          <li>You represent that you are authorized to use the submitted payment method.</li>
          <li>We do not store full card numbers or card security codes on our own servers.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          4. Made-To-Order Fulfillment
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Orders are made to order and fulfilled through third-party production partners, including the Printify provider network.</li>
          <li>Products may ship in separate packages when produced at different facilities.</li>
          <li>Once production begins, edits or cancellations may no longer be available.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          5. Shipping and Delivery
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Current processing window: {legal.shippingPolicy.processingWindowBusinessDays}.</li>
          <li>Standard transit is typically {legal.shippingPolicy.standardTransitBusinessDays}.</li>
          <li>Express transit is typically {legal.shippingPolicy.expressTransitBusinessDays}.</li>
          <li>{legal.shippingPolicy.estimatesDisclaimer}</li>
          <li>You are responsible for entering an accurate and complete shipping address.</li>
        </ul>
        <p className="mt-2">
          See our <Link className="text-foreground underline" to="/shipping">Shipping Policy</Link> for more detail.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          6. Returns, Replacements, and Order Issues
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>{legal.returnPolicy.sizeExchangeEligibilitySummary}</li>
          <li>{legal.returnPolicy.issueEligibilitySummary}</li>
          <li>{legal.returnPolicy.conditionSummary}</li>
          <li>{legal.returnPolicy.finalSaleSummary}</li>
          <li>{legal.returnPolicy.returnShippingSummary}</li>
        </ul>
        <p className="mt-2">
          See our <Link className="text-foreground underline" to="/returns">Returns Policy</Link> for the current process.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          7. Intellectual Property and User Content
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>Site content, branding, product graphics, and creative assets belong to us or our licensors.</li>
          <li>If you submit content, you represent that you have the right to submit it.</li>
          <li>We may reject content or cancel orders involving infringing, unlawful, or prohibited material.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          8. Warranty Disclaimer and Liability Limits
        </h2>
        <p className="mt-2">
          To the fullest extent permitted by law, the site and services are provided on an "as is"
          and "as available" basis. We are not liable for indirect, incidental, special, or
          consequential damages. Our total liability for any order-related claim will not exceed the
          amount paid for that order.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          9. Governing Law
        </h2>
        <p className="mt-2">
          These Terms are governed by the laws of {legal.governingLawRegion}, {legal.governingLawCountry},
          without regard to conflict-of-law rules, unless applicable consumer law requires otherwise.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          10. Updates and Contact
        </h2>
        <p className="mt-2">
          We may update these Terms from time to time. Updated terms are effective when posted with
          a revised date.
        </p>
        <p className="mt-2">
          Questions about these Terms can be sent to{" "}
          <a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          .
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Terms;

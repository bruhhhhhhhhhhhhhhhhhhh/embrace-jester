import StaticPageLayout from "@/components/StaticPageLayout";
import { legal } from "@/config/legal";

const Shipping = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Shipping"
    description="Most orders are produced after purchase. This page explains processing windows, transit estimates, and support options for delays."
  >
    <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
      <p>
        <strong className="text-foreground">Last updated:</strong> {legal.lastUpdatedShipping}
      </p>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Processing Times
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Most orders begin production within {legal.shippingPolicy.processingWindowBusinessDays}.</li>
          <li>Tracking updates are sent by email once the carrier scans the package.</li>
          <li>Large or high-volume drops may require longer production time.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Transit Estimates
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Standard shipping: typically {legal.shippingPolicy.standardTransitBusinessDays}.</li>
          <li>Express shipping: typically {legal.shippingPolicy.expressTransitBusinessDays}.</li>
          <li>International transit varies by carrier, customs, and destination.</li>
        </ul>
        <p className="mt-3">{legal.shippingPolicy.estimatesDisclaimer}</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Delays, Address Issues, and Support
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Incorrect or incomplete addresses can delay delivery or require carrier correction.</li>
          <li>If a delay occurs before production starts, cancellation or refund requests are reviewed by support based on the order stage and applicable law.</li>
          <li>For delivery questions, email{" "}<a className="text-foreground underline" href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>.</li>
        </ul>
      </section>
    </div>
  </StaticPageLayout>
);

export default Shipping;

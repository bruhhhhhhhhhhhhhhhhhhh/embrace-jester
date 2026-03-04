import StaticPageLayout from "@/components/StaticPageLayout";

const Shipping = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Shipping"
    description="Most orders are made-to-order through our fulfillment network. Shipping speed depends on product, destination, and selected method."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Processing Times
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Production usually starts within 1-3 business days.</li>
          <li>Tracking updates are sent by email once carriers scan the package.</li>
          <li>Pre-order or limited drops can run longer during high volume.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Delivery Windows
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Standard: typically 3-6 business days after fulfillment.</li>
          <li>Express: typically 1-2 business days after fulfillment where available.</li>
          <li>International timing varies by customs and destination country.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Shipping Rates
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Rates are calculated at checkout from live carrier estimates.</li>
          <li>Free standard shipping applies automatically when cart subtotal hits threshold.</li>
          <li>Large multi-item orders may ship in separate packages.</li>
        </ul>
      </section>
    </div>
  </StaticPageLayout>
);

export default Shipping;

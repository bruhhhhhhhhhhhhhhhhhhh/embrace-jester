import StaticPageLayout from "@/components/StaticPageLayout";

const Returns = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="Returns & Exchanges"
    description="If your item arrives damaged, misprinted, or the wrong size, we resolve it quickly. Standard refund and exchange eligibility is outlined below."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Eligible Returns
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Return requests should be submitted within 14 days of delivery.</li>
          <li>Items must be unworn and unwashed for size-based exchanges.</li>
          <li>Damaged or defective items are replaced or refunded after review.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Non-Returnable
        </h2>
        <ul className="mt-3 space-y-2 list-disc pl-5">
          <li>Custom or personalized items unless defective.</li>
          <li>Items with obvious wear or laundering.</li>
          <li>Final sale items marked non-returnable at purchase.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold uppercase tracking-wide text-foreground">
          Start A Request
        </h2>
        <p className="mt-3">
          Email support with order ID, reason, and photos if relevant. We typically respond within
          1 business day.
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default Returns;

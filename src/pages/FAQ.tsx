import StaticPageLayout from "@/components/StaticPageLayout";

const FAQ = () => (
  <StaticPageLayout
    eyebrow="Support"
    title="FAQ"
    description="Quick answers to common questions about ordering, payments, shipping, and product updates."
  >
    <div className="space-y-6 text-sm text-muted-foreground">
      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          How fast do orders ship?
        </h2>
        <p className="mt-2">
          Most orders are produced in 1-3 business days and then shipped based on selected delivery
          method.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          What payment methods are supported?
        </h2>
        <p className="mt-2">
          Checkout runs through Stripe, including card payments and accelerated wallet methods where
          available.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          Can I edit an order after payment?
        </h2>
        <p className="mt-2">
          Contact support immediately. If production has not started, we can usually update size,
          color, or address.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-base font-bold uppercase tracking-wide text-foreground">
          How do I track my order?
        </h2>
        <p className="mt-2">
          You will receive a shipping confirmation email with tracking information once the label is
          created by the carrier.
        </p>
      </section>
    </div>
  </StaticPageLayout>
);

export default FAQ;
